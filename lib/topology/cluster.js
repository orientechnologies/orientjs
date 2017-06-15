/*jshint esversion: 6 */
"use strict";
const OServer = require('./server');
const Promise = require('bluebird');
const EventEmitter = require('events').EventEmitter;

// First Node Strategy
const defaultSelectionStrategy = (cluster) => {
  return cluster.servers[0];
};
class OCluster extends EventEmitter{
  constructor(config) {
    super();
    this.config = config;
    this.selectionStrategy = this.config.selectionStrategy || defaultSelectionStrategy;
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

  acquireFrom(selection) {
    selection = selection || this.selectionStrategy;
    let server = selection(this);
    return server.acquireConnection().then((connection) => {
      return {server, connection};
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      Promise.some(this.servers.map(server => server.connect()), 1)
        .then((servers) => {
          servers.forEach((s)=>{
            s.on('cluster-config',this.emit.bind(this, 'cluster-config'));
          });
          resolve(this);
        }).catch((err) => {
        reject(err[0]);
      });
    });
  }
}

module.exports = OCluster;