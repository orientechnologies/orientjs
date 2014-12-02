"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DB_EXIST',
  opCode: 6,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
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