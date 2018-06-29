/*jshint esversion: 6 */
"use strict";

const Operation = require('../operation');

module.exports = Operation.extend({
  id: 'REQUEST_CONNECT',
  opCode: 2,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(-1)
    .writeBytes(Buffer.alloc(0))
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