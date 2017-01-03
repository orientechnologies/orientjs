/*jshint esversion: 6 */
"use strict";

class OCluster {
  constructor(config) {
    this.config = config;
    this.servers = [];
  }

  addServer(server) {
    server.owner = this;
    this.servers.push(server);
  }

  removeServer(server) {

  }
}

OCluster.fromConfig = function (config) {


};
module.exports = OCluster;