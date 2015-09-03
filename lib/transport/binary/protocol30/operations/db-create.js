"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DB_CREATE',
  opCode: 4,
  writer: function () {
    this
    .writeHeader(this.opCode, this.data.sessionId, this.data.token)
    .writeString(this.data.name)
    .writeString(this.data.type || 'graph')
    .writeString(this.data.storage || 'plocal');
  },
  reader: function () {
    this.readStatus('status');
  }
});