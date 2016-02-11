"use strict";

var Operation = require('../operation'),
    utils = require('../../../../utils');

module.exports = Operation.extend({
  id: 'REQUEST_COMMAND',
  opCode: 41,
  requestConfig: function () {
    var params = this.data.params;
    var prepared = utils.prepare(this.data.query, params && params.params),
        url = '/command/' + this.data.database + '/sql/' + prepared;
    if (this.data.limit) {
      url += '/' + this.data.limit;
    }
    return {
      method: 'POST',
      url: url
    };
  },
  processResponse: function (response) {
    return {
      status: {code: 0, sessionId: -1},
      results: [
        {
          type: 'l',
          content: response.result
        }
      ]
    };
  }
});
