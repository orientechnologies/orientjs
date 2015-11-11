"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_CONFIG_GET',
  opCode: 70,
  writer: function () {
    this
    .writeHeader(this.opCode, this.data.sessionId, this.data.token)
    .writeString(this.data.key);
  },
  reader: function () {
    this
    .readStatus('status')
    .readString('value');
  }
});