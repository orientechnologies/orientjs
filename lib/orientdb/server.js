'use strict';

var Manager			= require('./connection/manager'),
    OperationTypes	= require('./commands/operation_types'),
    parser			= require('./connection/parser'),
	Promise			= require('bluebird'),
    _				= require('lodash');

function EMPTY_FUNCTION() {}

var Server = exports.Server = function(options) {
    this.sessionId = -1;

    this.options		= options || {};
    this.host			= this.options.server_host || 'localhost';
    this.port			= this.options.server_port || 2424;
    this.username		= this.options.server_username || 'root';
    this.password		= this.options.server_password || '';
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
					userName: self.username,
					userPassword: self.password
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

Server.prototype.close = function() {
	var self	= this;

	return new Promise(function(resolve, reject) {
		self.send(OperationTypes.REQUEST_DB_CLOSE).then(
			function(results) {
				resolve(results);
			},
			function(error) {
				reject(error);
			}
		);
	});
};

Server.prototype.drop = Server.prototype.delete = function(database) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		database			= database || {};
		var databaseName	= database.name || '';
		var storageType		= database.storage || 'local';

		if(database.name == '') {
			return reject(Error('OrientDB: Database name is required.'));
		}

		var database	= {
			databaseName: databaseName,
			storageType:storageType
		};

		self.send(OperationTypes.REQUEST_DB_DROP, database).then(
			function(results){
				resolve(results);
			},
			function(error) {
				reject(error)
			}
		);
	});
};

Server.prototype.exist = function(name, type) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		name	= name.toLowerCase();
		type	= type.toLowerCase() || 'local';

		var data	= {
			databaseName: name,
			serverStorageType:type
		};

		self.send(OperationTypes.REQUEST_DB_EXIST, data).then(
			function(results){
				resolve(results);
			},
			function(error) {
				reject(error)
			}
		);
	});
};

Server.prototype.list = function() {
	var self	= this;

	return new Promise(function(resolve, reject) {
		self.send(OperationTypes.REQUEST_DB_LIST).then(
			function(results){
				results			= results || {};
				resolve(results);
			},
			function(error) {
				reject(error)
			}
		);
	});
};

Server.prototype.configList = function() {
	var self	= this;

	return new Promise(function(resolve, reject) {
		if (OperationTypes.SERVER_PROTOCOL_VERSION <= 13) {
			return reject(Error("OrientDB: configList supported with protocol > 13."));
		}

		self.send(OperationTypes.REQUEST_CONFIG_LIST).then(
			function(results) {
				resolve(results);
			},
			function(error) {
				reject(error);
			}
		);
	});
};

Server.prototype.configGet = function(key) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		var data	= {
			key:key
		};

		self.send(OperationTypes.REQUEST_CONFIG_GET, data).then(
			function(results) {
				resolve(results);
			},
			function(error) {
				reject(error);
			}
		);
	});
};

Server.prototype.configSet = function(key, value) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		var data	= {
			key:key,
			value:value
		};

		self.send(OperationTypes.REQUEST_CONFIG_SET, data).then(
			function(results) {
				resolve(results);
			},
			function(error) {
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
		var data	= {
			username:self.username,
			password:self.password
		};

		self.send(OperationTypes.REQUEST_SHUTDOWN, data).then(
			function(results){
				resolve(results);
			},
			function(error) {
				reject(error)
			}
		);
	});
};