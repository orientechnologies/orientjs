"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DATACLUSTER_ADD',
  opCode: 10,
  writer: function () {
    this
    .writeHeader(this.opCode, this.data.sessionId, this.data.token)
    .writeString(this.data.name)
    .writeShort(this.data.id || -1);
  },
  reader: function () {
    this
    .readStatus('status')
    .readShort('id');
  }
});