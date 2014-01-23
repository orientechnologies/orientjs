"use strict";

var Manager			= require("./manager"),
    OperationTypes	= require("../commands/operation_types"),
    parser			= require("./parser"),
    _				= require("lodash");

function EMPTY_FUNCTION() {}

var Server = exports.Server = function(options) {
    this.sessionId = -1;

    this.options		= options || {};
    this.host			= this.options.host || "localhost";
    this.port			= this.options.port || 2424;
    this.userName		= this.options.userName || "root";
    this.userPassword	= this.options.userPassword || "";
    this.logOperations	= this.options.logOperations || false;
    this.logError		= this.options.logError || false;

    this.manager		= new Manager(options);

    // Set up logger if any set
    if (!parser.isNullOrUndefined(this.options.logger) && _.isFunction(this.options.logger.debug) && _.isFunction(this.options.logger.error)) {
        this.logger = this.options.logger;
    } else {
        this.logger = {
            error: function(message, object) {},
            log: function(message, object) {},
            debug: function(message, object) {}
        };
    }
};

Server.prototype.init = function(callback) {
	var self	= this;
	callback	= callback || EMPTY_FUNCTION;

	if(self.sessionId === -1) {
		self.manager.connect(callback);
	} else {
		callback();
	}
};

Server.prototype.send = function(operation, options, callback) {
    var self	= this;

    if(_.isFunction(options)) {
        callback	= options;
        options		= null;
    }

    var callbackToCall	= callback;

    if(operation === OperationTypes.REQUEST_DB_CLOSE) {
        // this will reset the session ID such that one can reopen a closed connection
        callbackToCall	= function() {
            self.sessionId	= -1;
            callback();
        };
    }

    self.manager.writeRequest(self.sessionId, operation, options, callbackToCall);
};

Server.prototype.connect = function(callback) {
    var self = this;
    callback = callback || EMPTY_FUNCTION;

    self.init(function(error) {
        if (error) {
        	return callback(error);
        }

        var data = {
            userName: self.userName,
            userPassword: self.userPassword
        };

        self.send(OperationTypes.REQUEST_CONNECT, data, function(error, result) {
            if (error) {
            	return callback(error);
            }

            self.sessionId	= result.sessionId || -1;
            callback(error, self.sessionId);
        });
    });
};

Server.prototype.disconnect = function(callback) {
    var self = this;
    callback = callback || EMPTY_FUNCTION;

    self.send(OperationTypes.REQUEST_DB_CLOSE, callback);
};

Server.prototype.list = function(callback) {
    callback = callback || EMPTY_FUNCTION;

    this.send(OperationTypes.REQUEST_DB_LIST, function(error, result) {
        if(error) {
        	return callback(error);
        }

        var doc	= parser.deserializeDocument(result.content.toString());

        callback(null, doc.databases);
    });
};

Server.prototype.configList = function(callback) {
    callback = callback || EMPTY_FUNCTION;

    // disabled due to https://github.com/nuvolabase/orientdb/issues/1291
    if (OperationTypes.SERVER_PROTOCOL_VERSION === 13) {
        return callback(new Error("configList unsupported with OrientDB."));
    }

    this.send(OperationTypes.REQUEST_CONFIG_LIST, function(error, result) {
        if(error) {
        	return callback(err);
        }

        var config = {};
        
        for(var key in result.configEntries) {
            var entry = result.configEntries[key];
            config[entry.key] = entry.value;
        }

        callback(null, config);
    });
};

Server.prototype.configGet = function(configKey, callback) {
    callback = callback || EMPTY_FUNCTION;

    this.send(OperationTypes.REQUEST_CONFIG_GET, configKey, function(error, configValue) {
        if(error) {
        	return callback(error);
        }

        callback(null, configValue);
    });
};

Server.prototype.configSet = function(configKey, configValue, callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
        configKey: configKey,
        configValue: configValue
    };

    this.send(OperationTypes.REQUEST_CONFIG_SET, data, function(error) {
        callback(error);
    });
};

Server.prototype.freeze = function(databaseName, callback) {
    callback = callback || EMPTY_FUNCTION;
    
    this.send(OperationTypes.REQUEST_DB_FREEZE, databaseName, callback);
};

Server.prototype.release = function(databaseName, callback) {
    callback = callback || EMPTY_FUNCTION;
    
    this.send(OperationTypes.REQUEST_DB_RELEASE, databaseName, callback);
};

Server.prototype.shutdown = function(callback) {
    var self = this;
    callback = callback || EMPTY_FUNCTION;

    var data = {
        userName: self.userName,
        userPassword: self.userPassword
    };

    self.send(OperationTypes.REQUEST_SHUTDOWN, data, callback);
};