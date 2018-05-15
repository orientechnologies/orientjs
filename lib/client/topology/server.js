/*jshint esversion: 6 */
"use strict";

const EventEmitter = require("events").EventEmitter;
const ONetworkBinary = require("../network/index").ONetworkBinary;
const Promise = require("bluebird");

class OServer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    let subscribePool = config.subscribePool || { max: 2 };
    this.network = new ONetworkBinary(config);
    this.pushNetwork = new ONetworkBinary(
      Object.assign({}, config, {
        pool: subscribePool
      })
    );
    this.subscribedForCluster = false;
    this.connected = false;
    this.connectionErr = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      Promise.all([this.network.connect(), this.pushNetwork.connect()])
        .then(() => {
          this.connected = true;
          this.network.on(
            "live-query-result",
            this.emit.bind(this, "live-query-result")
          );
          this.network.on(
            "live-query-end",
            this.emit.bind(this, "live-query-end")
          );
          this.network.on("error", err => {
            this.connectionErr = err;
            this.connected = false;
          });
          this.pushNetwork.on(
            "cluster-config",
            this.emit.bind(this, "cluster-config")
          );
          this.pushNetwork.on("error", err => {});
          resolve(this);
        })
        .catch(reject);
    });
  }

  acquireConnection() {
    return this.network.acquireConnection();
  }

  acquireForSubscribe() {
    return this.pushNetwork.acquireConnection();
  }

  subscribeCluster(data) {
    if (this.subscribedForCluster) {
      return Promise.resolve();
    } else {
      return this.acquireForSubscribe().then(connection => {
        return connection.send("subscribe-push-distributed", data).then(() => {
          return connection.close();
        });
      });
    }
  }
}

module.exports = OServer;
