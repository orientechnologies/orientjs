/*jshint esversion: 6 */
"use strict";

const Operation = require('./subscribe-push'),
    constants = require('../constants');

module.exports = Operation.extend({
  writer: function () {
    this.writeHeader(this.opCode, this.data.sessionId, this.data.token);
    this.writeByte(1);
  }
});