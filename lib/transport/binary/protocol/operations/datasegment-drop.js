"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DATASEGMENT_DROP',
  opCode: 21,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeString(this.data.name);
  },
  reader: function () {
    this
    .readStatus('status')
    .readByte('success', function (data, fieldName) {
      data[fieldName] = Boolean(data[fieldName]);
    });
  }
});