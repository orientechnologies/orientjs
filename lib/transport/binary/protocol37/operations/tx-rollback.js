"use strict";

var Operation = require('./tx-commit'),
  constants = require('../constants'),
  RID = require('../../../../recordid'),
  serializer = require('../serializer');

module.exports = Operation.extend({
  id: 'REQUEST_TX_ROLLBACK',
  opCode: 64,

  writer: function () {
    this
      .writeHeader(this.opCode, this.data.sessionId, this.data.token)
      .writeInt(this.data.txId);
  },
  reader: function () {
    this
      .readStatus('status');
  }
});