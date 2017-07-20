/*jshint esversion: 6 */
"use strict";

const Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'SUBSCRIBE_PUSH',
  opCode: 100,
  writer: function () {
    this.writeHeader(this.opCode, this.data.sessionId, this.data.token);
  },
  reader: function () {
    this
    .readStatus('status');
  }
});