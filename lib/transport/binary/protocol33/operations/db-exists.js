"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DB_EXIST',
  opCode: 6,
  writer: function () {
    this
    .writeHeader(this.opCode, this.data.sessionId, this.data.token)
    .writeString(this.data.name)
    .writeString(this.data.storage || 'local');
  },
  reader: function () {
    this
    .readStatus('status')
    .readByte('exists', function (data) {
      data.exists = Boolean(data.exists);
    });
  }
});