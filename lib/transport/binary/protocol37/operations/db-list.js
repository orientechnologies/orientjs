"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DB_LIST',
  opCode: 74,
  writer: function () {
    this.writeHeader(this.opCode, this.data.sessionId, this.data.token);
  },
  reader: function () {
    this
    .readStatus('status')
    .readObject('databases', function (data, fieldName) {
      data[fieldName] = data[fieldName].databases;
    });
  }
});