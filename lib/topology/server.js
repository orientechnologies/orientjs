/*jshint esversion: 6 */
"use strict";

let EventEmitter = require('events').EventEmitter;
let ONetworkBinary = require('../network/index').ONetworkBinary;
let Promise = require('bluebird');

class OServer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.network = new ONetworkBinary(config);
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.network.connect().then(() => {
        this.network.on('live-query-result',this.emit.bind(this,'live-query-result'));
        this.network.on('live-query-end',this.emit.bind(this,'live-query-end'));
        resolve();
      }).catch(reject);
    });
  }

  acquireConnection() {
    return this.network.acquireConnection();
  }

}

module.exports = OServer;