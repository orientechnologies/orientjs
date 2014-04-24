"use strict";

var Operation = require('../operation'),
    npmPackage = require('../../../../../package.json');

module.exports = Operation.extend({
  id: 'REQUEST_DB_OPEN',
  opCode: 2,
  requestConfig: function () {
    return {
      method: 'GET',
      url: '/database/' + this.data.name
    };
  },
  processResponse: function (response) {
    return {
      status: {
        code: 0,
        sessionId: -1
      },
      sessionId: -1,
      totalClusters: response.clusters.length,
      clusters: response.clusters,
      serverCluster: {},
      release: response.server.version + ' (build ' + response.server.build + ')',
      classes: response.classes,
      indexes: response.indexes,
      config: response.config
    };
  }
});
