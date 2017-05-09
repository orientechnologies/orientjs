"use strict";

var Operation = require('./tx-commit'),
  constants = require('../constants'),
  RID = require('../../../../recordid'),
  serializer = require('../serializer');

module.exports = Operation.extend({
  id: 'REQUEST_TX_BEGIN',
  opCode: 61,

  reader: function () {
    this
      .readStatus('status')
      .readInt('txId');
  }
});