"use strict";

var Operation = require('./tx-commit'),
  constants = require('../constants'),
  RID = require('../../../../recordid'),
  serializer = require('../serializer');

module.exports = Operation.extend({
  id: 'REQUEST_BATCH',
  opCode: 35,

  writer : function() {
    this
      .writeHeader(this.opCode, this.data.sessionId, this.data.token)
      .writeInt(this.data.txId)
      .writeRecords();

  },
  reader: function () {
    this
      .readStatus('status')
      .readInt('txId')
      .readRecords();
  }
});