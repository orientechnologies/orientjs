/*jshint esversion: 6 */
"use strict";
const OServer = require("./server");
const Promise = require("bluebird");
const EventEmitter = require("events").EventEmitter;
const Net = require("net");
const Dns = require("dns");
const errors = require("../../errors");

// First Node Strategy
const defaultSelectionStrategy = cluster => {
  return cluster.servers.filter(s => {
    return s.connected === true;
  })[0];
};
class OCluster extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.selectionStrategy =
      this.config.selectionStrategy || defaultSelectionStrategy;
    this.servers = this._configureServers(config);
  }

  _configureServers(config) {
    let host = config.host;
    let port = config.port;
    let pool = config.pool;
    let ssl = config.ssl;
    let servers = config.servers || [];
    let firstServer = { host, port, pool, ssl };
    servers.unshift(firstServer);
    return servers.map(cfg => new OServer(cfg));
  }

  acquireFrom(selection) {
    selection = selection || this.selectionStrategy;
    let server = selection(this);
    if (!server) {
      return Promise.reject(
        new errors.ConnectionError(10, "Cannot select the server")
      );
    } else {
      return server.acquireConnection().then(connection => {
        return { server, connection };
      });
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      Promise.all(
        this.servers.map(server => {
          return server.connect().catch(err => {
            server.connected = false;
            server.connectionError = err;
            return server;
          });
        })
      )
        .then(servers => {
          let connected = 0;
          servers.forEach(s => {
            if (s.connected) {
              s.on("cluster-config", this.emit.bind(this, "cluster-config"));
              connected++;
            }
          });
          if (connected > 0) {
            resolve(this);
          } else {
            reject(servers[0].connectionError);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  close() {
    return Promise.all(this.servers.map(s => s.close()));
  }
}

module.exports = OCluster;
