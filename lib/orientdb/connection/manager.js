var net = require("net"),
    debug = require("./debug"),
    parser = require("./parser"),
    error = require("./error"),
    OperationTypes = require("../commands/operation_types"),
    DbOpen = require("../commands/DbOpen"),
    Connect = require("../commands/Connect");

/*------------------------------------------------------------------------------
  (public) Manager
  
  + options {host, port, database, user, password}
  - void
  
  Set up connection manager.
------------------------------------------------------------------------------*/
var Manager = module.exports = function Manager(options) {
    this._options = options;

    // hash of the supported operations
    this._operations = {};
    this._operations[OperationTypes.DB_OPEN] = new DbOpen();
    this._operations[OperationTypes.CONNECT] = new Connect();

    // protocol version which this client is using
    this._PROTOCOL_VERSION = 7;
    this._socket = null;

	// set up logging options
	debug.options({
		logOperations: options.logOperations,
		logErrors: options.logErrors
	});
	
	// session ID
	this._sessionId = -1;
	
	// count of commands executed from the module initiation
	this._commandsCount = 0;
	
	// queue with currently executing commands
	this._commandQueue = [];
	
	// initiate connection with the server
	this._init();
};

Manager.prototype = new process.EventEmitter();

/*------------------------------------------------------------------------------
  (private) _init
  
  + none
  - void
  
  Initiate connection with the server.
------------------------------------------------------------------------------*/
Manager.prototype._init = function() {
	var self = this,
		first = true;
	
	self._socket = net.createConnection(
		self._options.port,
		self._options.host
	);
	//self._socket.setEncoding("utf8");
	debug.log("Connecting");
	
	self._socket.on("connect", function() {
		debug.log("Connected");
	});

	self._socket.on("data", function (data) {
        if (first) {
            var version = data.readUInt16BE(0);

		    debug.log("Protocol: " + version);

			if (self._PROTOCOL_VERSION != version) {
				debug.log(
					"Server protocol version is not supported - " +
					"This driver supports only version " + 
					self._PROTOCOL_VERSION
				);
				self._socket.destroy();
				return;
			}
			first = false;
		} else {
            self._readResponse(data);
		}
	});

	self._socket.on("close", function (hadError) {
		debug.log("Closed " + hadError);
	});
};

/*------------------------------------------------------------------------------
  (private) _readResponse
  
  + data
  - void
  
  Parse data received from socket.
------------------------------------------------------------------------------*/
Manager.prototype._readResponse = function(data) {
    var self = this;
    var command = self._commandQueue.shift();

    debug.log("Response - Operation " + command.operationType + " (sid: " + command.sequence + ", size: " + data.length + ")");

    self._operations[command.operationType].read(data, function(errorData, result) {
        
        if (errorData) {
            var errors = error.parse(errorData);
            var errStr = debug.look(errors).join("\n");
            debug.log(errStr);
            command.callback(errStr);
            return;
        }
			
        if (result) {
            self._sessionId = result.sessionId;
        }

        command.callback(null, result);
        //self.emit("response", errorData, result, command);
    });
};

/*------------------------------------------------------------------------------
  (private) _writeRequest
  
  + operationType
  + data
  + callback
  - void
  
  Send operation request to the server.
------------------------------------------------------------------------------*/
Manager.prototype._writeRequest = function(operationType, data, callback) {
    var self = this;

    var command = {
        sequence: ++self._commandsCount,
        operationType: operationType,
        callback: callback
	};
    debug.log("Request - Operation " + command.operationType + " (sid: " + command.sequence + ")");

    if (self._sessionId == -1 &&
        operationType != OperationTypes.CONNECT &&
        operationType != OperationTypes.DB_OPEN) {

        debug.log("Cannot send request - Client has no session ID assigned");
        return;
    }

    self._operations[operationType].write(
        self._socket, 
        self._sessionId, 
        data,
        function() {
            self._commandQueue.push(command);
        }
    );
};

