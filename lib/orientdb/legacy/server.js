'use strict';

var Manager      = require('./connection/manager'),
    OperationTypes  = require('./commands/operation_types'),
    parser      = require('./connection/parser'),
    Promise      = require('bluebird'),
    _        = require('lodash');

function EMPTY_FUNCTION() {}

var Server = exports.Server = function(options) {
  this.sessionId = -1;

  this.options    = options || {};
  this.host      = this.options.server_host || 'localhost';
  this.port      = this.options.server_port || 2424;
  this.username    = this.options.server_username || 'root';
  this.password    = this.options.server_password || '';
  this.logOperations  = this.options.logOperations || false;
  this.logError    = this.options.logError || false;

  this.manager    = new Manager(options);

  // Set up logger if any set
  if (!parser.isNullOrUndefined(this.options.logger) && _.isFunction(this.options.logger.debug) && _.isFunction(this.options.logger.error)) {
      this.logger = this.options.logger;
  }
  else {
    this.logger = {
      error: function(message, object) {},
      log: function(message, object) {},
      debug: function(message, object) {}
    };
  }
};

Server.prototype.init = function() {
  if (this.sessionId !== -1)
    return Promise.resolve(this);
  return this.manager.connect()
  .bind(this)
  .then(function () {
    return this;
  });
};

Server.prototype.send = function(operation, options) {
  return this.manager.writeRequest(this.sessionId, operation, options)
  .bind(this)
  .then(function (results) {
    if (operation === OperationTypes.REQUEST_DB_CLOSE) {
      //Reset the session ID such that one can reopen a closed connection
      this.sessionId = -1;
    }
    return results;
  });
};

Server.prototype.connect = function() {
  return this.init()
  .bind(this)
  .then(function () {
    var data = {
      userName: this.username,
      userPassword: this.password
    };
    return this.send(OperationTypes.REQUEST_CONNECT, data);
  })
  .then(function (results) {
    this.sessionId = results.sessionId || -1;
    return this.sessionId;
  });
};

Server.prototype.close = function() {
  return this.send(OperationTypes.REQUEST_DB_CLOSE);
};

Server.prototype.drop = Server.prototype.delete = function(database) {
  database      = database || {};
  var databaseName  = database.name || '';
  var storageType    = database.storage || 'local';

  if (databaseName == '') {
    return Promise.reject(new Error('OrientDB: Database name is required.'));
  }

  return this.send(OperationTypes.REQUEST_DB_DROP, {
    databaseName: databaseName,
    storageType: storageType
  });
};

Server.prototype.exist = function(name, type) {
  return this.send(OperationTypes.REQUEST_DB_EXIST, {
    databaseName: name.toLowerCase(),
    serverStorageType: (''+type).toLowerCase() || 'local'
  });
};

Server.prototype.list = function() {
  return this.send(OperationTypes.REQUEST_DB_LIST)
  .then(function (results) {
    return results || {};
  });
};

Server.prototype.configList = function() {
  if (OperationTypes.SERVER_PROTOCOL_VERSION <= 13) {
    return Promise.reject(new Error("OrientDB: configList supported with protocol > 13."));
  }
  return this.send(OperationTypes.REQUEST_CONFIG_LIST);
};

Server.prototype.configGet = function(key) {
  return this.send(OperationTypes.REQUEST_CONFIG_GET, {
    key: key
  });
};

Server.prototype.configSet = function(key, value) {
  return this.send(OperationTypes.REQUEST_CONFIG_SET, {
    key: key,
    value: value
  });
};

Server.prototype.freeze = function(databaseName) {
  return this.send(OperationTypes.REQUEST_DB_FREEZE, databaseName);
};

Server.prototype.release = function(databaseName) {
  return this.send(OperationTypes.REQUEST_DB_RELEASE, databaseName);
};

Server.prototype.shutdown = function() {
  return this.send(OperationTypes.REQUEST_SHUTDOWN, {
    username: this.username,
    password: this.password
  });
};