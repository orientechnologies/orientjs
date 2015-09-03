"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DATACLUSTER_DATARANGE',
  opCode: 13,
  writer: function () {
    var total, i;

    this
    .writeHeader(this.opCode, this.data.sessionId, this.data.token)
    .writeShort(this.data.id);
  },
  reader: function () {
    this
    .readStatus('status')
    .readLong('begin')
    .readLong('end');
  }
});