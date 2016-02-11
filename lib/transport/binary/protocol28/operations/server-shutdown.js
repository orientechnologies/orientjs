"use strict";

var Operation = require('../operation'),
  constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_SHUTDOWN',
  opCode: 1,
  writer: function () {
    this.writeHeader(this.opCode, this.data.sessionId, this.data.token)
      .writeString(this.data.username)
      .writeString(this.data.password);

  },
  reader: function () {
    this
      .readStatus('status');
  }
});