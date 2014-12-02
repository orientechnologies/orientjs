"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DATACLUSTER_DROP',
  opCode: 11,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeShort(this.data.id);
  },
  reader: function () {
    this
    .readStatus('status')
    .readByte('success', function (data, fieldName) {
      data[fieldName] = Boolean(data[fieldName]);
    });
  }
});