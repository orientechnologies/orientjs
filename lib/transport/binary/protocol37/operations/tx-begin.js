/*jshint esversion: 6 */
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
      .readInt('txId')
      .readUpdateRids();

  },
  readUpdateRids(){

    this.readInt("totalUpdated");
    this.readArray("updated", (data) => {
      let items = [];
      for (let i = 0; i < data.totalUpdated; i++) {
        items.push(() => {
          this.readShort('tmpCluster')
            .readLong('tmpPosition')
            .readShort('cluster')
            .readLong('position');
        });
      }
      return items;
    });
  }
});