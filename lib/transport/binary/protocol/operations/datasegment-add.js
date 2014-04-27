"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DATASEGMENT_ADD',
  opCode: 20,
  writer: function () {
    var total, i;

    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeString(this.data.name)
    .writeString(this.data.location);
  },
  reader: function () {
    this
    .readStatus('status')
    .readInt('id');
  }
});