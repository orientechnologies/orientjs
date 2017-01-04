/*jshint esversion: 6 */
"use strict";

let Promise = require('bluebird');
let ONetworkConnection = require('./connection');
let genericPool = require('generic-pool');

class ONetworkPool {
  constructor(config) {
    let cfg = config.pool || {min: 2, max: 5};
    this.pool = genericPool.createPool(new PoolFactory(config), cfg);
  }


  acquire() {
    return this.pool.acquire();
  }

  release(resource) {
    return this.pool.release(resource);
  }


  size() {
    return this.pool.size;
  }

  available() {
    return this.pool.available;
  }

  borrowed() {
    return this.pool.borrowed;
  }

  pending() {
    return this.pool.pending;
  }
}

class PoolFactory {
  constructor(config) {
    this.config = config;
  }

  create() {

    return new Promise((resolve, reject) => {
      let network = new ONetworkConnection(this.config);
      // network.on('connect', () => {
      //   resolve(network);
      // });
      // network.once('error', (error) => {
      //   reject(error);
      // });
      network.connect().then(resolve).catch(reject);
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