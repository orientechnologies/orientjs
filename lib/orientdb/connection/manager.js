var net = require("net"),
    debug = require("./debug"),
    parser = require("./parser"),
    error = require("./error"),

    OperationTypes = require("../commands/operation_types"),

    Command = require("../commands/Command"),
    Connect = require("../commands/Connect"),
    DataclusterAdd = require("../commands/DataclusterAdd"),
    DataclusterCount = require("../commands/DataclusterCount"),
    DataclusterDatarange = require("../commands/DataclusterDatarange"),
    DataclusterRemove = require("../commands/DataclusterRemove"),
    DbClose = require("../commands/DbClose"),
    DbCountrecords = require("../commands/DbCountrecords"),
    DbCreate = require("../commands/DbCreate"),
    DbDelete = require("../commands/DbDelete"),
    DbExist = require("../commands/DbExist"),
    DbOpen = require("../commands/DbOpen"),
    DbReload = require("../commands/DbReload"),
    DbSize = require("../commands/DbSize"),
    RecordCreate = require("../commands/RecordCreate"),
    RecordDelete = require("../commands/RecordDelete"),
    RecordLoad = require("../commands/RecordLoad"),
    RecordUpdate = require("../commands/RecordUpdate"),
    Shutdown = require("../commands/Shutdown");

// the socket pool
var pool = {};

/*------------------------------------------------------------------------------
  (public) Manager

  + options {host, port, database, user, password}
  - void

  Set up connection manager.
------------------------------------------------------------------------------*/
var Manager = module.exports = function Manager(options) {

    // hash of the supported operations
    this.operations = {};
    this.operations[OperationTypes.COMMAND] = new Command();
    this.operations[OperationTypes.CONNECT] = new Connect();
    this.operations[OperationTypes.DATACLUSTER_ADD] = new DataclusterAdd();
    this.operations[OperationTypes.DATACLUSTER_COUNT] = new DataclusterCount();
    this.operations[OperationTypes.DATACLUSTER_DATARANGE] = new DataclusterDatarange();
    this.operations[OperationTypes.DATACLUSTER_REMOVE] = new DataclusterRemove();
    this.operations[OperationTypes.DB_CLOSE] = new DbClose();
    this.operations[OperationTypes.DB_COUNTRECORDS] = new DbCountrecords();
    this.operations[OperationTypes.DB_CREATE] = new DbCreate();
    this.operations[OperationTypes.DB_DELETE] = new DbDelete();
    this.operations[OperationTypes.DB_EXIST] = new DbExist();
    this.operations[OperationTypes.DB_OPEN] = new DbOpen();
    this.operations[OperationTypes.DB_RELOAD] = new DbReload();
    this.operations[OperationTypes.DB_SIZE] = new DbSize();
    this.operations[OperationTypes.RECORD_CREATE] = new RecordCreate();
    this.operations[OperationTypes.RECORD_DELETE] = new RecordDelete();
    this.operations[OperationTypes.RECORD_LOAD] = new RecordLoad();
    this.operations[OperationTypes.RECORD_UPDATE] = new RecordUpdate();
    this.operations[OperationTypes.SHUTDOWN] = new Shutdown();

    this.options = options || {};

    // protocol version which this client is using
    this._PROTOCOL_VERSION = 7;

    // set up logging options
    debug.options({
        logOperations: options.logOperations,
        logErrors: options.logErrors
    });

    // count of commands executed from the module initiation
    this._commandsCount = 0;

    // the socket pool key
    this.poolKey = this.options.host + ":" + this.options.port;
};


Manager.prototype = new process.EventEmitter();

/*------------------------------------------------------------------------------
  (private) connect

  + none
  - void

  Initiate connection with the server.
------------------------------------------------------------------------------*/
Manager.prototype.connect = function(callback) {
	var self = this;

    // there is no connection open on this socket
    if (!pool[self.poolKey]) {

        debug.log("Connecting on socket: " + self.poolKey);

        var socket = net.createConnection(self.options.port, self.options.host),
            commandQueue = [];

        pool[self.poolKey] = {
            socket: socket,
            commandQueue: commandQueue,
            count: 1
        };

        self.addSocketListeners(socket, callback);

        return;
    }

    pool[self.poolKey].count++;
    callback();
};


Manager.prototype.addSocketListeners = function(socket, callback) {
    var self = this;

    socket.on("connect", function() {
        debug.log("Connected");
        callback();
    });

    var first = true;

    socket.on("data", function (data) {
        if (first) {
            var version = data.readUInt16BE(0);

            debug.log("Protocol: " + version);

            if (self._PROTOCOL_VERSION != version) {
                debug.log(
                    "Server protocol version is not supported - " +
                    "This driver supports only version " +
                    self._PROTOCOL_VERSION
                );
                socket.destroy();
                return;
            }
            first = false;
        } else {
            self._readResponse(data);
        }
    });

    socket.on("close", function (hadError) {
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

    var command = pool[self.poolKey].commandQueue.shift();

    debug.log("Response - Operation " + command.operationType + " (sid: " + command.sequence + ", size: " + data.length + ")");

    self.operations[command.operationType].read(data, function(err, result) {

        if (err) {
            if (err instanceof Buffer) {
                err = error.parse(err);
                debug.log(JSON.stringify(err));
            }

            if (command.callback) {
                command.callback(err);
            }
            return;
        }

        if (command.operationType == OperationTypes.DB_CLOSE) {
            // close only if the last in the pool

            if (pool[self.poolKey].count == 1) {
                pool[self.poolKey].socket.end();
                delete pool[self.poolKey];
            } else {
                pool[self.poolKey].count--;
            }
        }

        if (command.callback) {
            command.callback(null, result);
        }
    });
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
Manager.prototype.writeRequest = function(sessionId, operationType, data, callback) {
    var self = this;

    if (data instanceof Function) {
        callback = data;
        data = null;
    }

    data = data || {};

    var command = {
        sequence: ++self._commandsCount,
        operationType: operationType,
        callback: callback,
        sessionId: sessionId
    };
    debug.log("Request - Operation " + command.operationType + " (sid: " + command.sequence + ")");

    if (sessionId == -1 &&
        operationType != OperationTypes.CONNECT &&
        operationType != OperationTypes.DB_OPEN) {

        debug.log("Cannot send request - Client has no session ID assigned");
        return;
    }

    var socket = pool[self.poolKey].socket;

    self.operations[operationType].write(
        socket,
        sessionId,
        data,
        function() {
            pool[self.poolKey].commandQueue.push(command);
        }
    );
};

