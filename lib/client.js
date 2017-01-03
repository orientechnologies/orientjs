/*jshint esversion: 6 */
"use strict";
let OCluster = require('./topology');

class OrientDBClient {

  constructor(cluster) {
    this.cluster = cluster;
  }
}

OrientDBClient.connect = function (config) {
  return OCluster.fromConfig(config)
    .then((cluster) => {
      return new OrientDBClient(cluster);
    });
};
module.exports = OrientDBClient;