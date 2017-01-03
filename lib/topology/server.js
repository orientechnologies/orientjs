/*jshint esversion: 6 */
"use strict";
let ONetworkBinary = require('../network/index');

class OServer {
  constructor(config, network) {
    this.config = config;
    this.network = network;
  }
}
OServer.fromConfig = function (config) {

  return ONetworkBinary.fromConfig(config)
    .then((network) => {
      return new OServer(config, network);
    });
};

module.exports = OServer;