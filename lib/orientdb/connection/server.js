var EventEmitter = require('events').EventEmitter,
    Manager = require("./manager"),
    OperationTypes = require("../commands/operation_types");
//    inherits = require('util').inherits;

var Server = exports.Server = function(options) {
    var self = this;

    this.options = options || {};
    this.host = this.options.host || "localhost";
    this.port = this.options.port || 2424;
    this.userName = this.options.user_name || "root";
    this.userPassword = this.options.user_password || '';
    this.logOperations = this.options.logOperations || false,
    this.logError = this.options.logError || false,

    this.manager = new Manager(options);

    this.poolSize = this.options.poolSize == null ? 1 : this.options.poolSize;
  
    // Set default connection pool options
    this.socketOptions = this.options.socketOptions != null ? this.options.socketOptions : {};

    // Set up logger if any set
    this.logger = this.options.logger != null 
        && (typeof this.options.logger.debug == 'function') 
        && (typeof this.options.logger.error == 'function') 
        && (typeof this.options.logger.debug == 'function') 
            ? this.options.logger : {error:function(message, object) {}, log:function(message, object) {}, debug:function(message, object) {}};
};

// Inherit simple event emitter
//inherits(Server, EventEmitter);


Server.prototype.send = function(operation, options, callback) {
    var self = this;
    
    self.manager._writeRequest(operation, options, callback);
};


Server.prototype.connect = function(callback) {
    var self = this;

    if (!self.sessionId) {
        var data = {
            user_name: self.userName,
            user_password: self.userPassword
        };
        self.send(OperationTypes.CONNECT, data, function(err, result) {

            if (err) { return callback(err); }

            result = result || {};
            callback(null, result.sessionId || -1);
        });
    }
};


Server.prototype.disconnect = function(callback) {
    var self = this;

    self.send(OperationTypes.DB_CLOSE, callback);
};

