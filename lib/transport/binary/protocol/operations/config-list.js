"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_CONFIG_LIST',
  opCode: 72,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId || -1);
  },
  reader: function () {
    this
    .readStatus('status')
    .readShort('total')
    .readArray('items', function (data) {
      var items = [],
          i;
      for (i = 0; i < data.total; i++) {
        items.push(function () {
          this
          .readString('key')
          .readString('value');
        });
      }
      return items;
    });
  }
});