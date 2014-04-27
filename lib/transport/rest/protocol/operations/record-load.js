"use strict";

var Operation = require('../operation'),
    npmPackage = require('../../../../../package.json');

module.exports = Operation.extend({
  id: 'REQUEST_RECORD_LOAD',
  opCode: 30,
  requestConfig: function () {
    var url = '/document/' + this.data.database + '/' + this.data.cluster + ':' + this.data.position;
    if (this.data.fetchPlan) {
      url += '/' + this.data.fetchPlan;
    }
    return {
      method: 'GET',
      url: url
    };
  },
  processResponse: function (response) {
    return {
      status: {code: 0, sessionId: -1},
      records: [response]
    };
  }
});
