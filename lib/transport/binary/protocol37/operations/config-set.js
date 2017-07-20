"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_CONFIG_SET',
  opCode: 71,
  writer: function () {
    this
    .writeHeader(this.opCode, this.data.sessionId, this.data.token)
    .writeString(this.data.key)
    .writeString(this.data.value);
  },
  reader: function () {
    this
    .readStatus('status')
    .readOps.push(function (data) {
      data.success = true;
    });
  }
});