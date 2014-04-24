"use strict";

var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DB_RELOAD',
  opCode: 73,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId || -1);
  },
  reader: function () {
    this
    .readStatus('status')
    .readShort('totalClusters')
    .readArray('clusters', function (data) {
      var clusters = [],
          total = data.totalClusters,
          i;

      for (i = 0; i < total; i++) {
        clusters.push(function (data) {
          this.readString('name')
          .readShort('id')
          .readString('type')
          .readShort('dataSegment');
        });
      }
      return clusters;
    });
  }
});