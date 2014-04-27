"use strict";

var Operation = require('../operation'),
    constants = require('../constants'),
    RID = require('../../../../recordid'),
    serializer = require('../serializer');

module.exports = Operation.extend({
  id: 'REQUEST_TX_COMMIT',
  opCode: 60,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId || -1)
    .writeInt(this.data.txId)
    .writeByte(this.data.txLog); // use transaction log


    // creates
    var total = this.data.creates.length,
        item, i;

    for (i = 0; i < total; i++) {
      item = this.data.creates[i][0];
      this.writeByte(1); // mark the start of an entry.
      this.writeByte(3); // create.
      this.writeShort(item['@rid'].cluster);
      this.writeLong(item['@rid'].position);
      this.writeByte(constants.RECORD_TYPES[item['@type'] || 'd'] || 100); // document by default
      this.writeBytes(serializer.encodeRecordData(item));
    }

    // updates
    total = this.data.updates.length;

    for (i = 0; i < total; i++) {
      item = this.data.updates[i][0];
      this.writeByte(1); // mark the start of an entry.
      this.writeByte(1); // update.
      this.writeShort(item['@rid'].cluster);
      this.writeLong(item['@rid'].position);
      this.writeByte(constants.RECORD_TYPES[item['@type'] || 'd'] || 100); // document by default
      this.writeInt(item['@version'] || 0);
      this.writeBytes(serializer.encodeRecordData(item));
    }

    // deletes
    total = this.data.deletes.length;

    for (i = 0; i < total; i++) {
      item = this.data.deletes[i][0];
      this.writeByte(1); // mark the start of an entry.
      this.writeByte(2); // delete
      this.writeShort(item['@rid'].cluster);
      this.writeLong(item['@rid'].position);
      this.writeByte(constants.RECORD_TYPES[item['@type'] || 'd'] || 100); // document by default
      this.writeInt(item['@version'] || 0);
    }

    this.writeByte(0); // no more documents
  },
  reader: function () {
    this
    .readStatus('status')
    .readInt('sessionId');
  }
});