'use strict';

var net = require('net'),
    fs = require('fs'),
    path = require('path'),
    debug = require('./debug'),
    parser = require('./parser'),
    Promise = require('bluebird'),
    _ = require('lodash'),
    constants = require('../constants.js'),
    OperationTypes = require('../commands/operation_types');

// the implemented command modules to be loaded from the 'commands' directory
var commands = {};

// Require command modules
(function(commands) {
  var modulePath = path.join(__dirname, '..', 'commands'),
      files = fs.readdirSync(modulePath),
      module, file, idx, length;



  for (idx = 0, length = files.length; idx < length; idx++) {

    file = files[idx];
    // only .js files
    if (file.slice(-3) !== '.js') {
      continue;
    }

    module = require(path.join(modulePath, file));
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
var Manager = module.exports = function Manager (options) {
  //Hash of the supported operations
  this.operations = commands;
  this.options = options || {};

  //Set up logging options
  debug.options({
    logOperations: this.options.logOperations,
    logErrors: this.options.logErrors
  });

  // count of commands executed from the module initiation
  this._commandsCount = 0;
  this.currentCommand = null;

  //Host
  this.host = this.options.server_host;
  this.port = this.options.server_port;

  // the socket pool key
  this.poolKey = this.host + ':' + this.port;

  // the socket pool
  this.socketPool = {};
  this.commandQueue = [];
};

Manager.prototype  = new process.EventEmitter();

/*------------------------------------------------------------------------------
 (private) connect

 + none
 - void

 Initiate connection with the server.
 ------------------------------------------------------------------------------*/
Manager.prototype.connect = function() {
  var promise;
  if (!this.socketPool[this.poolKey]) {
    debug.log("Connecting on socket: " + this.poolKey);
    var socket = net.createConnection(this.port, this.host);
    socket.setNoDelay(true);
    this.socketPool[this.poolKey] = {
      socket: socket,
      count: 1
    };
    promise = this.addSocketListeners(socket);
  }
  else
    promise = Promise.resolve();

  return promise
  .bind(this)
  .then(function () {
    this.socketPool[this.poolKey].count++;
  });
};

Manager.prototype.addSocketListeners = function(socket) {
  var deferred = Promise.defer(),
      first = true,
      connected = false;

  socket.on('connect', function() {
    debug.log('Connected');
    connected = true;
    deferred.resolve();
  });

  socket.on('error', function(error) {
    if (!connected) {
      var message = 'Socket error: ' + error.code;
      if (error.code === 'ECONNREFUSED') {
        message += "\nPlease check that the OrientDB server is running and you are using the correct socket host and port.";
        }
      this.socketPool[this.poolKey].socket.end();
    }
    debug.log('Socket error: ' + JSON.stringify(error));
    delete this.socketPool[this.poolKey];
    deferred.reject(error);
  }.bind(this));

  socket.on('data', function(data) {
    if (first) {
      OperationTypes.SERVER_PROTOCOL_VERSION  = data.readUInt16BE(0);
      debug.log('Protocol: ' + OperationTypes.SERVER_PROTOCOL_VERSION);
      if (OperationTypes.CURRENT_PROTOCOL_VERSION > OperationTypes.SERVER_PROTOCOL_VERSION) {
        var errorMessage = 'Server protocol version ' + OperationTypes.SERVER_PROTOCOL_VERSION + ' is not supported. This driver implements the server protocol version ' + OperationTypes.CURRENT_PROTOCOL_VERSION;
        debug.log(errorMessage);
        socket.destroy();
        delete this.socketPool[this.poolKey];
        var command  = this.commandQueue.shift();
        if (command.callback) {
          command.reject(new Error(errorMessage));
        }
        return;
      }

      first = false;
      var remainingData = new Buffer(data.length - parser.BYTES_SHORT);
      data.copy(remainingData, 0, parser.BYTES_SHORT);
      data = remainingData;
    }
    this.readResponse(data);
  }.bind(this));

  socket.on('close', function(error) {
    debug.log('Closed (error: ' + error + ')');
    if(error) {
      deferred.reject(error);
    }
  });

  return deferred.promise;
};

/*------------------------------------------------------------------------------
 (private) readResponse

 + data
 - void

 Parse data received from socket.
 ------------------------------------------------------------------------------*/
Manager.prototype.readResponse = function (data) {
  if (data.length === 0) {
    return;
  }
  var command  = this.currentCommand;

  do {
    if (!command || command.instance.done()) {
      command = this.currentCommand = this.commandQueue.shift();
    }

    if (!command) {
      return;
    }

    if (!command.started) {
      command.instance = new this.operations[command.operationType]();
      // If status is an error, handle it
      if (parser.readByte(data, 0)) {
        command.instance = new this.operations[OperationTypes.ERROR_COMMAND]();
      }
      command.started = true;
    }

    debug.log('Response - Operation ' + command.operationType + ' (sessionid: ' + command.sessionId + ', sid: ' + command.sequence + ', size: ' + data.length + ')');

    data = command.instance.read(data);
    // For commands that maintain a state, if the state became 'done'
    // or 'error' on this loop iteration, fire the callback.
    if (command.instance.error) {
      command.deferred.reject(command.instance.error);
    }
    else if (command.instance.done()) {
      command.deferred.resolve(command.instance.result);
    }
  }
  while (data.length > 0 && command.instance.done());
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
Manager.prototype.writeRequest = function (sessionId, operationType, data) {
  data  = data || {};

  if (operationType === OperationTypes.REQUEST_DB_OPEN) {
    sessionId = -1;
  }

  var deferred = Promise.defer(),
      command = {
        sequence: ++this._commandsCount,
        operationType: operationType,
        deferred: deferred,
        sessionId: sessionId
      },
      afterOperationWriteCallback;

  debug.log('Request - Operation ' + command.operationType + ' (sid: ' + command.sequence + ')');

  if (sessionId === -1
   && operationType !== OperationTypes.REQUEST_CONNECT
   && operationType !== OperationTypes.REQUEST_DB_OPEN
  ) {

    debug.log('Cannot send request - Client has no session ID assigned');

    // On REQUEST_DB_CLOSE, the connection count must be decremented even when the
    // session ID isn't valid.  Otherwise, it is impossible to close the
    // socket after a failed REQUEST_CONNECT or REQUEST_DB_OPEN.
    if (operationType === OperationTypes.REQUEST_DB_CLOSE) {
      this.close();
    }
    deferred.reject(new Error('Cannot send request - Client has no session ID assigned'));
    return deferred.promise;
  }

  var socket  = this.socketPool[this.poolKey].socket;


  if (command.operationType === OperationTypes.REQUEST_DB_CLOSE) {
    afterOperationWriteCallback = function() {
      this.close();
      deferred.resolve();
    }.bind(this);
  }
  else {
    afterOperationWriteCallback = function() {
      this.commandQueue.push(command);
    }.bind(this);
  }
  if (!this.operations[operationType])
    return deferred.reject(new Error('Unsupported Operation Type:' + operationType));
  this.operations[operationType].write(
    socket,
    sessionId,
    data,
    afterOperationWriteCallback,
    this
  );

  return deferred.promise;
};

/*------------------------------------------------------------------------------
 (private) close

 + none
 - void

 Decrement the connection count, closing the socket if this is the last
 connection.
 ------------------------------------------------------------------------------*/
Manager.prototype.close = function() {
  if (this.socketPool[this.poolKey]) {
    if (this.socketPool[this.poolKey].count === 1) {
      this.socketPool[this.poolKey].socket.end();
      delete this.socketPool[this.poolKey];
    }
    else {
      this.socketPool[this.poolKey].count--;
    }
  }
};