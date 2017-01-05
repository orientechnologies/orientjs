/*jshint esversion: 6 */
"use strict";
let ONetworkBinary = require('../network/index').ONetworkBinary;

class OServer {
  constructor(config) {
    this.config = config;
    this.network = new ONetworkBinary(config);
  }

  connect() {
    return this.network.connect();
  }
}

module.exports = OServer;