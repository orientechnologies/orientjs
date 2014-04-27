"use strict";

var utils = require('../../utils'),
    errors = require('../../errors'),
    Db = require('../../db/index'),
    Promise = require('bluebird'),
    request = require('request'),
    requestAsync = Promise.promisify(request),
    util = require('util'),
    deserializer = require('./protocol/deserializer'),
    operations = require('./protocol/operations'),
    EventEmitter = require('events').EventEmitter,
    npmPackage = require('../../../package.json');


/**
 * # Binary Transport
 *
 * @param {Object} config The configuration for the transport.
 */
function RestTransport (config) {
  EventEmitter.call(this);
  this.setMaxListeners(Infinity);
  this.configure(config || {});
}

util.inherits(RestTransport, EventEmitter);

RestTransport.extend = utils.extend;
RestTransport.prototype.augment = utils.augment;

RestTransport.protocol = require('./protocol');


module.exports = RestTransport;


/**
 * Configure the transport.
 *
 * @param  {Object} config The transport configuration.
 */
RestTransport.prototype.configure = function (config) {
  this.connecting = false;
  this.closing = false;

  this.host = config.host || config.hostname || 'localhost';
  this.port = config.port || 2424;
  this.username = config.username || 'root';
  this.password = config.password || '';

  this.sessionId = -1;
  this.configureLogger(config.logger || {});
};

/**
 * Configure the logger for the transport.
 *
 * @param  {Object}          config  The logger config
 * @return {RestTransport}           The transport instance with the configured logger.
 */
RestTransport.prototype.configureLogger = function (config) {
  this.logger = {
    error: config.error || console.error.bind(console),
    log: config.log || console.log.bind(console),
    debug: config.debug || function () {} // do not log debug by default
  };
  return this;
};


/**
 * Send an operation to the server,
 *
 * @param  {Integer} operation The id of the operation to send.
 * @param  {Object} options    The options for the operation.
 * @promise {Mixed}            The result of the operation.
 */
RestTransport.prototype.send = function (operation, options) {
  options = options || {};
  return this.process(operation, options);
};


/**
 * Close the connection to the server.
 *
 * @return {Server} the disconnected server instance
 */
RestTransport.prototype.close = function () {
  if (!this.closing && this.socket) {
    this.closing = false;
    this.sessionId = -1;
  }
  return this;
};


RestTransport.prototype.process = function (op, params) {
  if (typeof op === 'string') {
    op = new operations[op](params || {});
  }

  var prepared = this.prepareRequest(op);

  return requestAsync(prepared)
  .spread(this.handleResponse.bind(this, op, prepared))
  .bind(op)
  .then(op.processResponse);
};

RestTransport.prototype.prepareRequest = function (op) {
  var config = op.requestConfig();
  config.url = 'http://' + this.host + ':' + this.port + (config.url || '/');
  config.headers = config.headers || {};
  config.headers['User-Agent'] = npmPackage.name + ' v' + npmPackage.version;
  if (!op.jar && !this.jar) {
    config.jar = this.jar = request.jar();
  }
  else {
    config.jar = op.jar || this.jar;
  }

  if (!config.jar.getCookieString('OSESSIONID')) {
    this.applyAuth(config);
  }

  return config;
};

RestTransport.prototype.applyAuth = function (config) {
  config.auth = {
    username: this.username,
    password: this.password
  };
  return config;
};

RestTransport.prototype.handleResponse = function (op, prepared, response) {
  if (response.statusCode === 401) {
    return requestAsync(this.applyAuth(prepared))
    .bind(this)
    .spread(function (response) {
      if (response.statusCode > 399) {
        return Promise.reject(new errors.Request('Authorization Error'));
      }
      else {
        return deserializer.deserializeDocument(response.body);
      }
    });
  }
  else {
    return deserializer.deserializeDocument(response.body);
  }
};