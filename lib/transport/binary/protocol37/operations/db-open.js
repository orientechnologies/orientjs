/*jshint esversion: 6 */
"use strict";
const Operation = require('../operation');

module.exports = Operation.extend({
  id: 'REQUEST_DB_OPEN',
  opCode: 3,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(-1)
    .writeString(this.data.name)
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
