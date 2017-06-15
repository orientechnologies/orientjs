/*jshint esversion: 6 */
"use strict";

const EventEmitter = require('events').EventEmitter;
const ONetworkBinary = require('../network/index').ONetworkBinary;
const Promise = require('bluebird');

class OServer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.network = new ONetworkBinary(config);
    this.pushNetwork = new ONetworkBinary(config);
    this.subscribedForCluster = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      Promise.all([this.network.connect(), this.pushNetwork.connect()]).then(() => {
        this.network.on('live-query-result', this.emit.bind(this, 'live-query-result'));
        this.network.on('live-query-end', this.emit.bind(this, 'live-query-end'));
        this.pushNetwork.on('cluster-config', this.emit.bind(this, 'cluster-config'));
        resolve(this);
      }).catch(reject);
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
      return this.acquireForSubscribe()
        .then((connection) => {
          return connection.send('subscribe-push-distributed', data)
            .then(() => {
              return connection.close();
            });
        });
    }
  }
}

module.exports = OServer;