'use strict';

var net				= require('net'),
    fs				= require('fs'),
    path			= require('path'),
    debug			= require('./debug'),
    parser			= require('./parser'),
	Promise			= require('bluebird'),
    _				= require('lodash'),
	constants		= require('../constants.js'),
    OperationTypes	= require('../commands/operation_types');

// the implemented command modules to be loaded from the 'commands' directory
var commands = {};

// Require command modules
(function(commands) {
    var modulePath = path.join(__dirname, '..', 'commands'),
        files = fs.readdirSync(modulePath);

    for (var idx = 0, length = files.length; idx < length; idx++) {

        var file = files[idx];

        // only .js files
        if (file.indexOf('.js') !== file.length - 3) {
            continue;
        }

        var module = require(path.join(modulePath, file));
        if (module.operation) {
            commands[module.operation] = module;
        }
    }
})(commands);

/*------------------------------------------------------------------------------
 (public) Manager

 + options {host, port, database, user, password}
 - void

 Set up connection manager.
 ------------------------------------------------------------------------------*/
var Manager = module.exports = function Manager(options) {
    //Hash of the supported operations
    this.operations	= commands;
    this.options	= options || {};

    //Set up logging options
    debug.options({
        logOperations: this.options.logOperations,
        logErrors: this.options.logErrors
    });

    // count of commands executed from the module initiation
    this._commandsCount	= 0;
    this.currentCommand	= null;

	//Host
	this.host			= this.options.server_host;
	this.port			= this.options.server_port;

    // the socket pool key
    this.poolKey		= this.host + ':' + this.port;

    // the socket pool
    this.socketPool		= {};
    this.commandQueue	= [];
};

Manager.prototype	= new process.EventEmitter();

/*------------------------------------------------------------------------------
 (private) connect

 + none
 - void

 Initiate connection with the server.
 ------------------------------------------------------------------------------*/
Manager.prototype.connect = function() {
    var self	= this;

	return new Promise(function(resolve, reject) {
		// there is no connection open on this socket
		if(!self.socketPool[self.poolKey]) {
			debug.log("Connecting on socket: " + self.poolKey);

			var socket	= net.createConnection(self.port, self.host);
			socket.setNoDelay(true);

			self.socketPool[self.poolKey]	= {
				socket: socket,
				count: 1
			};

			self.addSocketListeners(socket, resolve, reject);
			return;
		}

		self.socketPool[self.poolKey].count++;
		resolve();
	});
};

Manager.prototype.addSocketListeners = function(socket, resolve, reject) {
    var self		= this;
    var first		= true;
    var connected	= false;

    socket.on('connect', function() {
		debug.log('Connected');
        connected = true;
		resolve();
    });

    socket.on('error', function(error) {
        if (!connected) {
            var message = 'Socket error: ' + error.code;

            if (error.code === 'ECONNREFUSED') {
                message += "\nPlease check that the OrientDB server is running and you are using the correct socket host and port.";
            }

            self.socketPool[self.poolKey].socket.end();
            reject(Error(message));
        }

		debug.log('Socket error: ' + JSON.stringify(error));
        delete self.socketPool[self.poolKey];
    });

    socket.on('data', function(data) {
		if (first) {
            OperationTypes.SERVER_PROTOCOL_VERSION	= data.readUInt16BE(0);
            
            debug.log('Protocol: ' + OperationTypes.SERVER_PROTOCOL_VERSION);

            if(OperationTypes.CURRENT_PROTOCOL_VERSION > OperationTypes.SERVER_PROTOCOL_VERSION) {
                var errorMessage = 'Server protocol version ' + OperationTypes.SERVER_PROTOCOL_VERSION + ' is not supported. This driver implements the server protocol version ' + OperationTypes.CURRENT_PROTOCOL_VERSION;
                debug.log(errorMessage);

                socket.destroy();
                delete self.socketPool[self.poolKey];

                var command	= self.commandQueue.shift();

                if(command.callback) {
                    command.callback(new Error(errorMessage));
                }

                return;
            }

            first				= false;
            var remainingData	= new Buffer(data.length - parser.BYTES_SHORT);
            data.copy(remainingData, 0, parser.BYTES_SHORT);
            data				= remainingData;
        }

        self.readResponse(data);
    });

    socket.on('close', function(hadError) {
		debug.log('Closed (error: ' + hadError + ')');
    });
};

/*------------------------------------------------------------------------------
 (private) readResponse

 + data
 - void

 Parse data received from socket.
 ------------------------------------------------------------------------------*/
Manager.prototype.readResponse = function(data) {
	if(data.length === 0) {
        return;
    }

    var self	= this;
    var command	= self.currentCommand;

    do {
        if(!command || command.instance.done()) {
            command = self.currentCommand = self.commandQueue.shift();
        }

		if(!command) {
			return;
		}

		if(!command.started) {
            command.instance = new self.operations[command.operationType]();

            // If status is an error, handle it
            if (parser.readByte(data, 0)) {
                command.instance = new self.operations[OperationTypes.ERROR_COMMAND]();
            }

            command.started = true;
        }

        debug.log('Response - Operation ' + command.operationType + ' (sessionid: ' + command.sessionId + ', sid: ' + command.sequence + ', size: ' + data.length + ')');

		data	= command.instance.read(data);
        // For commands that maintain a state, if the state became 'done'
        // or 'error' on this loop iteration, fire the callback.
        if(command.instance.error) {
            command.callback(command.instance.error);
        } else if (command.instance.done()) {
            command.callback(null, command.instance.result);
        }

    } while (data.length > 0 && command.instance.done());
};

/*------------------------------------------------------------------------------
 (public) writeRequest

 + sessionId
 + operationType
 + [data]
 + callback
 - void

 Send operation request to the server.
 ------------------------------------------------------------------------------*/
Manager.prototype.writeRequest = function(sessionId, operationType, data) {
    var self	= this;

	return new Promise(function(resolve, reject) {
		data	= data || {};

		function callback(error, results){
			//return new Promise(function() {
				if(error) {
					reject(error);
				} else {
					resolve(results);
				}
			//});
		}

		// TODO this is not necessary anymore after proper session ID implementation
		if (operationType === OperationTypes.REQUEST_DB_OPEN) {
			sessionId = -1;
		}

		var command	= {
			sequence: ++self._commandsCount,
			operationType: operationType,
			callback: callback,
			sessionId: sessionId
		};

		debug.log('Request - Operation ' + command.operationType + ' (sid: ' + command.sequence + ')');

		if(sessionId === -1 &&
			operationType !== OperationTypes.REQUEST_CONNECT &&
			operationType !== OperationTypes.REQUEST_DB_OPEN) {

			debug.log('Cannot send request - Client has no session ID assigned');

			// On REQUEST_DB_CLOSE, the connection count must be decremented even when the
			// session ID isn't valid.  Otherwise, it is impossible to close the
			// socket after a failed REQUEST_CONNECT or REQUEST_DB_OPEN.
			if (operationType === OperationTypes.REQUEST_DB_CLOSE) {
				self.close();
			}

			return;
		}

		var socket	= self.socketPool[self.poolKey].socket;

		var afterOperationWriteCallback	= function() {
			self.commandQueue.push(command);
		};

		if (command.operationType === OperationTypes.REQUEST_DB_CLOSE) {
			afterOperationWriteCallback = function() {
				self.close();
				resolve();
			};
		}

		self.operations[operationType].write(
			socket,
			sessionId,
			data,
			afterOperationWriteCallback,
			self
		);
	});
};

/*------------------------------------------------------------------------------
 (private) close

 + none
 - void

 Decrement the connection count, closing the socket if this is the last
 connection.
 ------------------------------------------------------------------------------*/
Manager.prototype.close = function() {
    var self = this;

	if (self.socketPool[self.poolKey]) {
        if (self.socketPool[self.poolKey].count === 1) {
            self.socketPool[self.poolKey].socket.end();
            delete self.socketPool[self.poolKey];
        } else {
            self.socketPool[self.poolKey].count--;
        }
    }
};