var net = require("net"),
    debug = require("./debug"),
    parser = require("./parser"),
    error = require("./error"),

    OperationTypes = require("../commands/operation_types"),

    Connect = require("../commands/Connect"),
    DbOpen = require("../commands/DbOpen"),
    DbCreate = require("../commands/DbCreate"),
    DbClose = require("../commands/DbClose"),
    DbExist = require("../commands/DbExist"),
    DbReload = require("../commands/DbReload"),
    DbDelete = require("../commands/DbDelete"),
    DbSize = require("../commands/DbSize"),
    DbCountrecords = require("../commands/DbCountrecords");

/*------------------------------------------------------------------------------
  (public) Manager
  
  + options {host, port, database, user, password}
  - void
  
  Set up connection manager.
------------------------------------------------------------------------------*/
var Manager = module.exports = function Manager(options) {
    this.options = options || null;

    // hash of the supported operations
    this.operations = {};
    this.operations[OperationTypes.CONNECT] = new Connect();
    this.operations[OperationTypes.DB_OPEN] = new DbOpen();
    this.operations[OperationTypes.DB_CREATE] = new DbCreate();
    this.operations[OperationTypes.DB_CLOSE] = new DbClose();
    this.operations[OperationTypes.DB_EXIST] = new DbExist();
    this.operations[OperationTypes.DB_RELOAD] = new DbReload();
    this.operations[OperationTypes.DB_DELETE] = new DbDelete();
    this.operations[OperationTypes.DB_SIZE] = new DbSize();
    this.operations[OperationTypes.DB_COUNTRECORDS] = new DbCountrecords();

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
		self.options.port,
		self.options.host
	);
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

    self.operations[command.operationType].read(data, function(errorData, result) {

        if (errorData) {
            if (errorData instanceof Buffer) {
                var errors = error.parse(errorData);
                debug.log(JSON.stringify(errors));
                command.callback(errors);
                return;
            }
            
            command.callback(errorData);
            return;
        }

        if (result && result.sessionId) {
            self._sessionId = result.sessionId;
        }

        command.callback(null, result);
    });
};

/*------------------------------------------------------------------------------
  (private) _writeRequest
  
  + operationType
  + [data]
  + callback
  - void
  
  Send operation request to the server.
------------------------------------------------------------------------------*/
Manager.prototype._writeRequest = function(operationType, data, callback) {
    var self = this;

    if (data instanceof Function) {
        callback = data;
        data = null;
    }
    
    data = data || {};

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

    self.operations[operationType].write(
        self._socket, 
        self._sessionId, 
        data,
        function() {
            self._commandQueue.push(command);
        }
    );
};

