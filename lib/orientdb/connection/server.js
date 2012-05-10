var Manager = require("./manager"),
    OperationTypes = require("../commands/operation_types");

function EMPTY_FUNCTION() {
}

var Server = exports.Server = function(options) {
    this.sessionId = -1;

    this.options = options || {};
    this.host = this.options.host || "localhost";
    this.port = this.options.port || 2424;
    this.userName = this.options.user_name || "root";
    this.userPassword = this.options.user_password || '';
    this.logOperations = this.options.logOperations || false;
    this.logError = this.options.logError || false;

    this.manager = new Manager(options);

    // Set up logger if any set
    if (!this.options.logger !== null && typeof this.options.logger !== "undefined" && (typeof this.options.logger.debug === 'function') && (typeof this.options.logger.error === 'function')) {
        this.logger = this.options.logger
    } else {
        this.logger = {
            error: function(message, object) {
            },
            log: function(message, object) {
            },
            debug: function(message, object) {
            }
        }
    }
};


Server.prototype.send = function(operation, options, callback) {
    this.manager.writeRequest(this.sessionId, operation, options, callback);
};


Server.prototype.connect = function(callback) {
    var self = this;
    callback = callback || EMPTY_FUNCTION;

    self.init(function() {

        var data = {
            user_name: self.userName,
            user_password: self.userPassword
        };

        self.send(OperationTypes.CONNECT, data, function(err, result) {

            if (err) { return callback(err); }

            result = result || {};
            self.sessionId = result.sessionId || -1;

            callback(err, self.sessionId);
        });
    });
};


Server.prototype.disconnect = function(callback) {
    var self = this;
    callback = callback || EMPTY_FUNCTION;

    self.send(OperationTypes.DB_CLOSE, callback);
};


Server.prototype.shutdown = function(callback) {
    var self = this;
    callback = callback || EMPTY_FUNCTION;

    var data = {
        user_name: self.userName,
        user_password: self.userPassword
    };

    self.send(OperationTypes.SHUTDOWN, data, callback);
};


Server.prototype.init = function(callback) {
    var self = this;
    callback = callback || EMPTY_FUNCTION;

    if (self.sessionId === -1) {
        self.manager.connect(callback);
    } else {
        callback();
    }
};

