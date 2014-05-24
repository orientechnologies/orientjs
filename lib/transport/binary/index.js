"use strict";

var ConnectionPool = require('./connection-pool'),
    Connection = require('./connection'),
    utils = require('../../utils'),
    errors = require('../../errors'),
    Db = require('../../db/index'),
    Promise = require('bluebird'),
    net = require('net'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;


/**
 * # Binary Transport
 *
 * @param {Object} config The configuration for the transport.
 */
function BinaryTransport (config) {
  EventEmitter.call(this);
  this.setMaxListeners(Infinity);
  this.configure(config || {});
}

util.inherits(BinaryTransport, EventEmitter);

BinaryTransport.extend = utils.extend;
BinaryTransport.prototype.augment = utils.augment;

BinaryTransport.protocol = require('./protocol');


module.exports = BinaryTransport;


/**
 * Configure the transport.
 *
 * @param  {Object} config The transport configuration.
 */
BinaryTransport.prototype.configure = function (config) {
  this.connecting = false;
  this.closing = false;

  this.host = config.host || config.hostname || 'localhost';
  this.port = config.port || 2424;
  this.username = config.username || 'root';
  this.password = config.password || '';

  this.sessionId = -1;
  this.configureLogger(config.logger || {});
  if (config.pool) {
    this.configurePool(config.pool);
  }
  else {
    this.configureConnection();
  }
};

/**
 * Configure the logger for the transport.
 *
 * @param  {Object}          config  The logger config
 * @return {BinaryTransport}         The transport instance with the configured logger.
 */
BinaryTransport.prototype.configureLogger = function (config) {
  this.logger = {
    error: config.error || console.error.bind(console),
    log: config.log || console.log.bind(console),
    debug: config.debug || function () {} // do not log debug by default
  };
  return this;
};


/**
 * Configure a connection for the transport.
 *
 * @return {BinaryTransport} The transport instance with the configured connection.
 */
BinaryTransport.prototype.configureConnection = function () {
  this.connection = new Connection({
    host: this.host,
    port: this.port,
    logger: this.logger
  });
  this.connection.on('update-config', function (config) {
    this.logger.debug('updating config...');
    this.transportCluster = config;
  }.bind(this));
  return this;
};

/**
 * Configure a connection pool for the transport.
 *
 * @param  {Object}          config The connection pool config
 * @return {BinaryTransport}        The transport instance with the configured connection pool.
 */
BinaryTransport.prototype.configurePool = function (config) {
  this.pool = new ConnectionPool({
    host: this.host,
    port: this.port,
    logger: this.logger,
    max: config.max
  });
  this.pool.on('update-config', function (config) {
    this.logger.debug('updating config...');
    this.serverCluster = config;
  }.bind(this));
  return this;
};



/**
 * Connect to the server.
 *
 * @promise {BinaryTransport} The connected transport instance.
 */
BinaryTransport.prototype.connect = function () {
  if (this.sessionId !== -1) {
    return Promise.resolve(this);
  }

  if (this.connecting) {
    return this.connecting;
  }

  this.connecting = (this.pool || this.connection).send('connect', {
    username: this.username,
    password: this.password
  })
  .bind(this)
  .then(function (response) {
    this.logger.debug('got session id: ' + response.sessionId);
    this.sessionId = response.sessionId;
    return this;
  });

  return this.connecting;
};

/**
 * Send an operation to the server,
 *
 * @param  {Integer} operation The id of the operation to send.
 * @param  {Object} options    The options for the operation.
 * @promise {Mixed}            The result of the operation.
 */
BinaryTransport.prototype.send = function (operation, options) {
  options = options || {};
  if (~this.sessionId || options.sessionId != null) {
    options.sessionId = options.sessionId != null ? options.sessionId : this.sessionId;
    return (this.pool || this.connection).send(operation, options);
  }
  else {
    return this.connect()
    .then(function (server) {
      options.sessionId = options.sessionId != null ? options.sessionId : this.sessionId;
      return (server.pool || server.connection).send(operation, options);
    });
  }
};


/**
 * Close the connection to the server.
 *
 * @return {BinaryTransport} the disconnected transport instance
 */
BinaryTransport.prototype.close = function () {
  (this.pool || this.connection).close();
  return this;
};