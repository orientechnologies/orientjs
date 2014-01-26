'use strict';

var Manager			= require('./manager'),
    OperationTypes	= require('../commands/operation_types'),
    parser			= require('./parser'),
	Promise			= require('promise'),
    _				= require('lodash');

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

Server.prototype.init = function() {
	var self	= this;

	return new Promise(function(resolve, reject) {
		if(self.sessionId === -1) {
			self.manager.connect().then(
				function(results){
					resolve();
				},
				function(error){
					reject(error);
				}
			);
		} else {
			resolve();
		}
	});
};

Server.prototype.send = function(operation, options) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		self.manager.writeRequest(self.sessionId, operation, options).then(
			function(results){
				if(operation === OperationTypes.REQUEST_DB_CLOSE) {
					//Reset the session ID such that one can reopen a closed connection
					self.sessionId	= -1;
				}

				resolve(results);
			},
			function(error){
				reject(error);
			}
		);
	});
};

Server.prototype.connect = function() {
	var self	= this;

	return new Promise(function(resolve, reject) {
		self.init().then(
			function(results){
				var data = {
					userName: self.userName,
					userPassword: self.userPassword
				};

				self.send(OperationTypes.REQUEST_CONNECT, data).then(
					function(results){
						self.sessionId	= results.sessionId || -1;
						resolve(self.sessionId);
					},
					function(error){
						reject(error);
					}
				);
			},
			function(error){
				reject(error);
			}
		);
	});
};

Server.prototype.disconnect = function() {
	var self	= this;

	return new Promise(function(resolve, reject) {
		self.send(OperationTypes.REQUEST_DB_CLOSE).then(
			function(results){
				resolve(results);
			},
			function(error){
				reject(error);
			}
		);
	});
};

Server.prototype.list = function() {
	var self	= this;

	return new Promise(function(resolve, reject) {
		self.send(OperationTypes.REQUEST_DB_LIST).then(
			function(results){
				var doc	= parser.deserializeDocument(result.content.toString());
				resolve(doc.databases);
			},
			function(error){
				reject(error);
			}
		);
    });
};

Server.prototype.configList = function() {
	var self	= this;

	return new Promise(function(resolve, reject) {
		// disabled due to https://github.com/nuvolabase/orientdb/issues/1291
		if (OperationTypes.SERVER_PROTOCOL_VERSION === 13) {
			return reject(Error("configList unsupported with OrientDB."));
		}

		self.send(OperationTypes.REQUEST_CONFIG_LIST).then(
			function(results){
				var config = {};

				for(var key in result.configEntries) {
					var entry = result.configEntries[key];
					config[entry.key] = entry.value;
				}

				resolve(config);
			},
			function(error){
				reject(error);
			}
		);
	});
};

Server.prototype.configGet = function(configKey) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		self.send(OperationTypes.REQUEST_CONFIG_GET, configKey).then(
			function(results){
				resolve(results);
			},
			function(error){
				reject(error);
			}
		);
    });
};

Server.prototype.configSet = function(configKey, configValue) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		var data = {
			configKey: configKey,
			configValue: configValue
		};

		self.send(OperationTypes.REQUEST_CONFIG_SET, data).then(
			function(results){
				resolve(results);
			},
			function(error){
				reject(error);
			}
		);
	});
};

Server.prototype.freeze = function(databaseName) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		self.send(OperationTypes.REQUEST_DB_FREEZE, databaseName).then(
			function(results){
				resolve(results);
			},
			function(error){
				reject(error);
			}
		);
	});
};

Server.prototype.release = function(databaseName) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		self.send(OperationTypes.REQUEST_DB_RELEASE, databaseName).then(
			function(results){
				resolve(results);
			},
			function(error){
				reject(error);
			}
		);
	});
};

Server.prototype.shutdown = function() {
	var self	= this;

	return new Promise(function(resolve, reject) {
		var data = {
			userName: self.userName,
			userPassword: self.userPassword
		};

		self.send(OperationTypes.REQUEST_SHUTDOWN, data).then(
			function(results){
				resolve(results);
			},
			function(error){
				reject(error);
			}
		);
	});
};