"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DB_COUNTRECORDS',
  opCode: 9,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId);
  },
  reader: function () {
    this
    .readStatus('status')
    .readLong('count');
  }
});