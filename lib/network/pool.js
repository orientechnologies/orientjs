/*jshint esversion: 6 */
"use strict";

const Promise = require('bluebird');

const ONetworkConnection = require('./connection');
const BasePool = require('../pool').BasePool;


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
      network.on('update-config', this.pool.emit.bind(this.pool, 'cluster-config'));
      network.connect().then((net) => {
        net.on('error', (err) => {
          this.pool.emit('error', err);
        });
        resolve(net);
      }).catch((err) => {
        // temporary workaround for generic-pool. Use resolve
        // instead of reject otherwise it will end up on infinite loop
        resolve(err);
      });
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