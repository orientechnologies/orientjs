"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DATACLUSTER_ADD',
  opCode: 10,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeString(this.data.type)
    .writeString(this.data.name)
    .writeString(this.data.location || null)
    .writeString(this.data.segmentName || null)
    .writeShort(this.data.id || -1);
  },
  reader: function () {
    this
    .readStatus('status')
    .readShort('id');
  }
});