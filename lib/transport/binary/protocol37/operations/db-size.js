"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DB_SIZE',
  opCode: 8,
  writer: function () {
    this.writeHeader(this.opCode, this.data.sessionId, this.data.token);
  },
  reader: function () {
    this
    .readStatus('status')
    .readLong('size');
  }
});