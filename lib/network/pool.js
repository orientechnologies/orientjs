/*jshint esversion: 6 */
"use strict";

let Promise = require('bluebird');

let ONetworkConnection = require('./connection');
let BasePool = require('../pool').BasePool;


class ONetworkPool extends BasePool {
  constructor(config) {
    super(config);
  }

  createPool(config) {
    return new PoolFactory(config, this);
  }

}

class PoolFactory {
  constructor(config, pool) {
    this.config = config;
    this.pool = pool;
  }

  create() {

    return new Promise((resolve, reject) => {
      let network = new ONetworkConnection(this.config, this.pool);
      network.on('live-query-result', this.pool.emit.bind(this.pool, 'live-query-result'));
      network.on('live-query-end', this.pool.emit.bind(this.pool, 'live-query-end'));
      network.connect().then((net) => {
        resolve(net);
      }).catch(reject);
    });
  }

  destroy(network) {
    return new Promise((resolve) => {
      network.once('close', () => {
        resolve();
      });
      network.close();
    });
  }
}


module.exports = ONetworkPool;