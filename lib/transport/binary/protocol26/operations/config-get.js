"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_CONFIG_GET',
  opCode: 70,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId || -1)
    .writeString(this.data.key);
  },
  reader: function () {
    this
    .readStatus('status')
    .readString('value');
  }
});