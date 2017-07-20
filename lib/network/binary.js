/*jshint esversion: 6 */
"use strict";


const EventEmitter = require('events').EventEmitter;
const ONetworkPool = require('./pool');

class ONetworkBinary extends EventEmitter {

  constructor(config) {
    super();
    this.config = config;
    this.pool = new ONetworkPool(config);
  }

  connect() {

    this.pool.on('live-query-result', this.emit.bind(this, 'live-query-result'));
    this.pool.on('live-query-end', this.emit.bind(this, 'live-query-end'));
    this.pool.on('cluster-config', this.emit.bind(this, 'cluster-config'));
    this.pool.on('error', this.emit.bind(this, 'error'));
    return this.pool.acquire()
      .then((conn) => {
        this.protocolVersion = conn.protocolVersion;
        this.serializationType = conn.protocol.constants.SERIALIZATION_FORMAT;
        return this.pool.release(conn);
      });
  }

  acquireConnection() {
    return this.pool.acquire();
  }
}

module.exports = ONetworkBinary;






