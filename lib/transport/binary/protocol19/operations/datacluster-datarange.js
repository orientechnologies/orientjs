"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DATACLUSTER_DATARANGE',
  opCode: 13,
  writer: function () {
    var total, i;

    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeShort(this.data.id);
  },
  reader: function () {
    this
    .readStatus('status')
    .readLong('begin')
    .readLong('end');
  }
});