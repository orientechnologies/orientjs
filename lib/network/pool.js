/*jshint esversion: 6 */
"use strict";

let Promise = require('bluebird');
let ONetworkConnection = require('./connection');
let genericPool = require('generic-pool');

class ONetworkPool {
  constructor(config) {
    this.pool = genericPool.createPool(new PoolFactory(config), config.pool);
  }
}

class PoolFactory {
  constructor(config) {
    this.config = config;
  }

  create() {
    return new Promise((resolve, reject) => {
      let network = new ONetworkConnection(this.config);
      network.on('connect', () => {
        resolve(network);
      });
      network.once('error', (error) => {
        reject(error);
      });
    });
  }

  destroy(network) {
    return new Promise((resolve) => {
      network.once('close', () => {
        resolve();
      });
    });
  }
}


module.exports = ONetworkPool;