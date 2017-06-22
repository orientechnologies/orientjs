"use strict";

var Operation = require('../operation'),
    constants = require('../constants'),
    npmPackage = require('../../../../../package.json');

module.exports = Operation.extend({
  id: 'REQUEST_CONNECT',
  opCode: 2,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(-1)
    .writeString(this.data.username)
    .writeString(this.data.password);
  },
  reader: function () {
    this
    .readStatus('status')
    .readInt('sessionId')
    .readBytes('token');
  }
});