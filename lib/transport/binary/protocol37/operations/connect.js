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
    .writeInt(this.data.sessionId || -1)
    .writeString('') // client id
    .writeBoolean(this.data.useToken) // use JWT?
    .writeBoolean(true) // Support for PUSH?
    .writeBoolean(true) // Collect stats ?
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