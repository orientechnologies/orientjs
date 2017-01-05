/*jshint esversion: 6 */
"use strict";

let Promise = require('bluebird');
let ONetworkPool = require('./pool');

class ONetworkBinary {

  constructor(config) {
    this.config = config;
    this.pool = new ONetworkPool(config);
  }

  connect() {
    return this.pool.acquire()
      .then(this.pool.release.bind(this));
  }
}

module.exports = ONetworkBinary;






