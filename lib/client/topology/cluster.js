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
    let logger = config.logger;
    let servers = config.servers || [];
    let firstServer = { host, port, pool, ssl, logger };
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

  _reconfigureServers(cfg) {
    let mapped = cfg.reduce((acc, current) => {
      let values = current.address.split(":");
      let host = values[0];
      let port = parseInt(values[1]);
      acc[current.address] = { host, port };
      return acc;
    }, {});

    this.servers.forEach(({ config }) => {
      let addr = mapped[`${config.host}:${config.port}`];
      if (addr) {
        delete mapped[`${config.host}:${config.port}`];
      }
    });

    let newServers = Object.keys(mapped).map(addr => {
      let host = mapped[addr].host;
      let port = mapped[addr].port;
      let pool = this.config.pool;
      let ssl = this.config.ssl;
      let logger = this.config.logger;
      let newCfg = { host, port, pool, ssl, logger };
      return new OServer(newCfg);
    });

    this.servers.push(...newServers);

    Promise.all(
      this.servers
        .filter(s => !s.connected)
        .map(s => {
          return s.connect().catch(err => {
            console.log(err);
            s.connected = false;
            s.connecting = null;
            s.connectionError = err;
            return s;
          });
        })
    ).then(s => {
      this._notifyClusterTopology();
    });
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
              s.on("cluster-config", cfg => {
                this.emit("cluster-config", cfg);
                this._reconfigureServers(cfg);
              });
              s.on("server-offline", () => {
                this._notifyClusterTopology();
              });
              connected++;
            }
          });
          if (connected > 0) {
            resolve(this);
          } else {
            reject(servers[0].connectionError);
          }
          this._notifyClusterTopology();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  _notifyClusterTopology() {
    this.emit(
      "cluster-topology",
      this.servers.map(s => {
        return {
          host: s.config.host,
          port: s.config.port,
          connected: s.connected
        };
      })
    );
  }
  close() {
    return Promise.all(this.servers.map(s => s.close()));
  }
}

module.exports = OCluster;
