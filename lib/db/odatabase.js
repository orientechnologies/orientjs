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
  Db.call(this, config);
  this.configureTransport(config);
  this.sessionId = -1;
  this.server = new MockServer(this.server.logger, this.transport);
  this.pool = owner;

}

ODatabase.prototype = Object.create(Db.prototype, {});

ODatabase.prototype.constructor = ODatabase;

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


ODatabase.prototype.close = function (force) {

  if (!force && this.pool) {
    this.pool.release(this);
    return Promise.resolve(this);
  } else {
    return Db.prototype.close.call(this);
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

