"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DATACLUSTER_COUNT',
  opCode: 12,
  writer: function () {
    var total, item, i;

    this.writeHeader(this.opCode, this.data.sessionId, this.data.token);

    if (Array.isArray(this.data.id)) {
      total = this.data.id.length;
      this.writeShort(total);
      for (i = 0; i < total; i++) {
        this.writeShort(this.data.id[i]);
      }
    }
    else {
      this
      .writeShort(1)
      .writeShort(this.data.id);
    }
    this.writeByte(this.data.tombstones || false);
  },
  reader: function () {
    this
    .readStatus('status')
    .readLong('count');
  }
});