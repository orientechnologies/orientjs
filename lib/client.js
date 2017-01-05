/*jshint esversion: 6 */
"use strict";
let OCluster = require('./topology').OCluster;

class OrientDBClient {

  constructor(config) {
    this.config = config;
    this.cluster = new OCluster(config);
    this.connecting = null;
  }

  connect() {
    if (!this.connecting) {
      if (!this.cluster) {
        this.cluster = new OCluster();
      }
      this.connecting = this.cluster.connect()
        .then(() => {
          this.connecting = null;
        });
    }
    return this.connecting;
  }
}

module.exports = OrientDBClient;