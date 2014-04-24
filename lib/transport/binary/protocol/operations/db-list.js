"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DB_LIST',
  opCode: 74,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId || -1);
  },
  reader: function () {
    this
    .readStatus('status')
    .readObject('databases', function (data, fieldName) {
      data[fieldName] = data[fieldName].databases;
    });
  }
});