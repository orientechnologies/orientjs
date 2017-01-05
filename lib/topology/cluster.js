/*jshint esversion: 6 */
"use strict";
let OServer = require('./server');
let Promise = require('bluebird');
class OCluster {
  constructor(config) {
    this.config = config;
    this.servers = this._configureServers(config);
  }

  _configureServers(config) {
    let host = config.host;
    let port = config.port;
    let pool = config.pool;
    let servers = config.servers || [];
    let firstServer = {host, port, pool};
    servers.unshift(firstServer);
    return servers.map(cfg => new OServer(cfg));
  }

  connect() {
    return new Promise((resolve, reject) => {
      Promise.some(this.servers.map(server => server.connect()), 1)
        .then(() => {
          resolve();
        }).catch((err) => {
        reject(err[0]);
      });
    });
  }
}

module.exports = OCluster;