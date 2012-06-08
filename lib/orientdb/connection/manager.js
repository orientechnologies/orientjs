var net = require("net"),
    fs = require("fs"),
    path = require("path"),
    debug = require("./debug"),
    parser = require("./parser"),
    error = require("./error"),
    OperationTypes = require("../commands/operation_types");

// the implemented command modules to be loaded from the 'commands' directory
var commands = {};

// the socket pool
var socketPool = {};
var commandQueue = [];

// Require command modules
(function(commands) {
    var modulePath = path.join(__dirname, "..", "commands"),
        files = fs.readdirSync(modulePath);

    for (var i in files) {

        var file = files[i];

        // only .js files
        if (file.indexOf(".js") !== file.length - 3) {
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

    // hash of the supported operations
    this.operations = commands;

    this.options = options || {};

    // protocol version which this client is using
    this._PROTOCOL_VERSION = 12;

    // set up logging options
    debug.options({
        logOperations: options.logOperations,
        logErrors: options.logErrors
    });

    // count of commands executed from the module initiation
    this._commandsCount = 0;

    this.currentCommand = null;

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
    if (!socketPool[self.poolKey]) {

        debug.log("Connecting on socket: " + self.poolKey);

        var socket = net.createConnection(self.options.port, self.options.host);
        socket.setNoDelay(true);

        socketPool[self.poolKey] = {
            socket: socket,
            count: 1
        };

        self.addSocketListeners(socket, callback);

        return;
    }

    socketPool[self.poolKey].count++;
    callback();
};


Manager.prototype.addSocketListeners = function(socket, callback) {
    var self = this;

    var first = true,
        connected = false;

    socket.on("connect", function() {
        debug.log("Connected");
        connected = true;
        callback();
    });

    socket.on("error", function(error) {
        if (!connected) {
            var message = "Socket error: " + error.code;
            if (error.code === "ECONNREFUSED") {
                message += "\nPlease check that the OrientDB server is running and you are using the correct socket host and port."
            }
            callback(message);
        }
        debug.log("Socket error: " + JSON.stringify(error));
    });

    socket.on("data", function(data) {

        if (first) {
            var version = data.readUInt16BE(0);

            debug.log("Protocol: " + version);

            if (self._PROTOCOL_VERSION > version) {
                var errorMessage = "Server protocol version " + version + " is not supported. This driver implements the server protocol version " + self._PROTOCOL_VERSION;
                debug.log(errorMessage);

                socket.destroy();
                delete socketPool[self.poolKey];

                var command = commandQueue.shift();
                if (command.callback) {
                    command.callback(errorMessage);
                }

                return;
            }
            first = false;
            var remainingData = new Buffer(data.length - parser.BYTES_SHORT);
            data.copy(remainingData, 0, parser.BYTES_SHORT);
            data = remainingData;
        }

        self.readResponse(data);
    });

    socket.on("close", function(hadError) {
        debug.log("Closed (error: " + hadError + ")");
    });
};

/*------------------------------------------------------------------------------
 (private) readResponse

 + data
 - void

 Parse data received from socket.
 ------------------------------------------------------------------------------*/
Manager.prototype.readResponse = function(data) {
    if (data.length === 0) {
        return;
    }

    var self = this,
        command = self.currentCommand;

    do {

        if (!command || command.instance.done()) {
            command = self.currentCommand = commandQueue.shift();
        }

        if (!command.started) {

            command.instance = new self.operations[command.operationType];

            // If status is an error, handle it
            if (parser.readByte(data, 0)) {
                command.instance = new self.operations[OperationTypes.ERROR_COMMAND];
            }

            command.started = true;
        }

        debug.log("Response - Operation " + command.operationType + " (sessionid: " + command.sessionId + ", sid: " + command.sequence + ", size: " + data.length + ")");

        data = command.instance.read(data);

        // For commands that maintain a state, if the state became "done"
        // or "error" on this loop iteration, fire the callback.
        if (command.instance.error) {
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
Manager.prototype.writeRequest = function(sessionId, operationType, data, callback) {
    var self = this;

    if (typeof data === "function") {
        callback = data;
        data = null;
    }

    data = data || {};

    // TODO this is not necessary anymore after proper session ID implementation
    if (operationType === OperationTypes.DB_OPEN) {
        sessionId = -1;
    }

    var command = {
        sequence: ++self._commandsCount,
        operationType: operationType,
        callback: callback,
        sessionId: sessionId
    };
    debug.log("Request - Operation " + command.operationType + " (sid: " + command.sequence + ")");

    if (sessionId === -1 &&
        operationType !== OperationTypes.CONNECT &&
        operationType !== OperationTypes.DB_OPEN) {

        debug.log("Cannot send request - Client has no session ID assigned");

        // On DB_CLOSE, the connection count must be decremented even when the
        // session ID isn't valid.  Otherwise, it is impossible to close the
        // socket after a failed CONNECT or DB_OPEN.
        if (operationType === OperationTypes.DB_CLOSE) {
            self.close();
        }

        return;
    }

    var socket = socketPool[self.poolKey].socket;

    var afterOperationWriteCallback = function() {
        commandQueue.push(command);
    };

    if (command.operationType === OperationTypes.DB_CLOSE) {
        afterOperationWriteCallback = function() {
            self.close();
            callback();
        };
    }

    self.operations[operationType].write(
        socket,
        sessionId,
        data,
        afterOperationWriteCallback
    );

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

    if (socketPool[self.poolKey].count === 1) {
        socketPool[self.poolKey].socket.end();
        delete socketPool[self.poolKey];
    } else {
        socketPool[self.poolKey].count--;
    }
};
