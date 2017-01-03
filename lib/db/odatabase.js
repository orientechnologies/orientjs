"use strict";

var Db = require('./db'),
  inherits = require("util").inherits,
  Promise = require('bluebird'),
  EventEmitter = require('events').EventEmitter,
  BinaryTransport = require('../transport/binary'),
  RestTransport = require('../transport/rest');


/**
 * Database Constructor.
 *
 * @param {Object} config The optional configuration for the database.
 */
function ODatabase(config, owner) {
  this.configureTransport(config);
  this.configureLogger(config.logger || {});
  config.server = new MockServer(this.logger, this.transport);
  Db.call(this, config);
  this.sessionId = -1;
  this.pool = owner;

}

ODatabase.prototype = Object.create(Db.prototype, {});

ODatabase.prototype.constructor = ODatabase;


/**
 * Configure the logger for the database.
 *
 * @param  {Object} config The logger config
 * @return {Server}        The database instance with the configured logger.
 */
ODatabase.prototype.configureLogger = function (config) {
  this.logger = {
    error: config.error || console.error.bind(console),
    log: config.log || console.log.bind(console),
    debug: config.debug || function () {
    } // do not log debug by default
  };
};

/**
 * Configure the transport for the database.
 *
 * @param  {Object} config The database config.
 * @return {Server}        The configured database object.
 */
ODatabase.prototype.configureTransport = function (config) {
  if (config.transport === 'rest') {
    this.transport = new RestTransport(config);
  }
  else {
    this.transport = new BinaryTransport(config);
    this.transport.skipServerConnect = true;
  }

  this.transport.on('reset', function () {
    this.sessionId = null;
  }.bind(this));
  return this;
};

ODatabase.prototype.open = function () {
  if (this.sessionId != null && this.sessionId !== -1) {
    return Promise.resolve(this);
  }

  if (!this.opening) {
    this.server.logger.debug('opening database connection to ' + this.name);
    this.opening = this.server.send('db-open', {
        name: this.name,
        type: this.type,
        username: this.username,
        password: this.password,
        useToken: this.useToken
      })
      .bind(this)
      .then(function (response) {
        this.server.logger.debug('got session id ' + response.sessionId + ' for database ' + this.name);
        this.opening = null;
        this.sessionId = response.sessionId;
        this.cluster.cacheData(response.clusters);
        this.serverCluster = response.serverCluster;
        this.token = response.token;
        this.release = response.release;
        this.server.once('error', function () {
          this.sessionId = null;
        }.bind(this));
        return this;
      });
  }

  return this.opening;
};

ODatabase.prototype.close = function (force) {

  if (!force && this.pool) {
    this.pool.release(this);
    return Promise.resolve(this);
  } else {
    if (this.pool) {
      return Db.prototype.close.call(this);
    } else {
      return Db.prototype.close.call(this).then(this.forceClose.bind(this));
    }
  }
};

ODatabase.prototype.forceClose = function () {
  this.transport.close();
};
function MockServer(logger, transport) {
  this.logger = logger;
  this.transport = transport;
}
inherits(MockServer, EventEmitter);
MockServer.prototype.send = function (operation, options) {
  return this.transport.send(operation, options);
};


module.exports = ODatabase;

