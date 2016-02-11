"use strict";

var Connection = require('./connection'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Promise = require('bluebird');

function ConnectionPool (config) {
  EventEmitter.call(this);
  config = config || {};
  this.host = config.host || 'localhost';
  this.port = +config.port || 2424;
  this.max = config.max || 1;
  this.logger = config.logger || {debug: function () {}};
  this.index = -1;
  this.connections = [];

}

util.inherits(ConnectionPool, EventEmitter);
module.exports = ConnectionPool;

/**
 * Dip into the pool and retrieve a connection.
 * @return {Connection} A connection instance.
 */
ConnectionPool.prototype.dip = function () {
  if (++this.index >= this.max)  {
    this.index = 0;
  }

  if (this.index > this.connections.length - 1) {
    this.connections.push(this.createConnection());
  }
  return this.connections[this.index];
};

/**
 * Create a new connection instance.
 * @return {Connection} The connection instance.
 */
ConnectionPool.prototype.createConnection = function () {
  var connection = new Connection({
    host: this.host,
    port: this.port,
    logger: this.logger
  });

  connection.on('update-config', function (config) {
    this.emit('update-config', config);
  });
  return connection;
};

/**
 * Send an operation via one of the conections in the pool.
 *
 * @param  {Integer} operation The id of the operation to send.
 * @param  {Object} options    The options for the operation.
 * @promise {Mixed}            The result of the operation.
 */
ConnectionPool.prototype.send = function (operation, options) {
  return this.dip()
  .connect()
  .then(function (connection) {
    return connection.send(operation, options);
  });
};


/**
 * Close all the connections in the pool.
 *
 * @return {ConnectionPool} The connection pool with sockets closed.
 */
ConnectionPool.prototype.close = function () {
  this.connections.forEach(function (connection) {
    connection.close();
  });
  this.connections = [];
  this.index = -1;
  return this;
};