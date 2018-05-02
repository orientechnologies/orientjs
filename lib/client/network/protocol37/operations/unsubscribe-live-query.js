/*jshint esversion: 6 */
"use strict";

const Operation = require('./subscribe-push');
const constants = require('../constants');
const serializer = require('../serializer');

module.exports = Operation.extend({
  opCode: 101,
  writer: function () {
    this.writeHeader(this.opCode, this.data.sessionId, this.data.token)
      .writeByte(2)
      .writeInt(this.data.monitorId);
  },
  reader(){
    this
      .readStatus('status');
  }
});