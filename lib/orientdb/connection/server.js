"use strict";

var Manager = require("./manager"),
    OperationTypes = require("../commands/operation_types"),
    parser = require("./parser"),
    _ = require("lodash");

function EMPTY_FUNCTION() {
}

var Server = exports.Server = function(options) {
    this.sessionId = -1;

    this.options = options || {};
    this.host = this.options.host || "localhost";
    this.port = this.options.port || 2424;
    this.userName = this.options.user_name || "root";
    this.userPassword = this.options.user_password || "";
    this.logOperations = this.options.logOperations || false;
    this.logError = this.options.logError || false;

    this.manager = new Manager(options);

    // Set up logger if any set
    if (!parser.isNullOrUndefined(this.options.logger) && _.isFunction(this.options.logger.debug) && _.isFunction(this.options.logger.error)) {
        this.logger = this.options.logger;
    } else {
        this.logger = {
            error: function(message, object) {
            },
            log: function(message, object) {
            },
            debug: function(message, object) {
            }
        };
    }
};


Server.prototype.send = function(operation, options, callback) {
    var self = this;
    if (_.isFunction(options)) {
        callback = options;
        options = null;
    }

    var callbackToCall = callback;
    if (operation === OperationTypes.DB_CLOSE) {
        // this will reset the session ID such that one can reopen a closed connection
        callbackToCall = function() {
            self.sessionId = -1;
            callback();
        };
    }
    self.manager.writeRequest(self.sessionId, operation, options, callbackToCall);
};


Server.prototype.connect = function(callback) {
    var self = this;
    callback = callback || EMPTY_FUNCTION;

    self.init(function(err) {

        if (err) { return callback(err); }

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


Server.prototype.listDatabases = function(callback) {
    callback = callback || EMPTY_FUNCTION;

    this.send(OperationTypes.DB_LIST, function(err, result) {
        if (err) return callback(err);

        var doc = parser.deserializeDocument(result.content.toString());

        callback(null, doc.databases);
    });
};


Server.prototype.configList = function(callback) {
    callback = callback || EMPTY_FUNCTION;

    // disabled due to https://github.com/nuvolabase/orientdb/issues/1291
    if (this.manager.serverProtocolVersion === 13) {
        return callback(new Error("configList unsupported with OrientDB 1.3.0"));
    }
    
    this.send(OperationTypes.CONFIG_LIST, function(err, result) {
        if (err) return callback(err);

        var config = {};
        for (var key in result.configEntries) {
            var entry = result.configEntries[key];
            config[entry.key] = entry.value;
        }

        callback(null, config);
    });
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

