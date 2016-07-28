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
      .writeHeader(this.opCode, this.data.sessionId, this.data.token)
      .writeInt(this.data.txId)
      .writeByte(this.data.txLog); // use transaction log


    // creates
    var total = this.data.creates.length,
      item, i;

    for (i = 0; i < total; i++) {
      item = this.data.creates[i];
      this.writeByte(1); // mark the start of an entry.
      this.writeByte(3); // create.
      this.writeShort(item['@rid'].cluster);
      this.writeLong(item['@rid'].position);
      this.writeByte(constants.RECORD_TYPES[item['@type'] || 'd'] || 100); // document by default
      if (item['@type'] === 'b') {
        this.writeBytes(item);
      }
      else {
        this.writeBytes(serializer.encodeRecordData(item));
      }
    }

    // updates
    total = this.data.updates.length;

    for (i = 0; i < total; i++) {
      item = this.data.updates[i];
      this.writeByte(1); // mark the start of an entry.
      this.writeByte(1); // update.
      this.writeShort(item['@rid'].cluster);
      this.writeLong(item['@rid'].position);
      this.writeByte(constants.RECORD_TYPES[item['@type'] || 'd'] || 100); // document by default
      this.writeInt(item['@version'] || 0);
      if (item['@type'] === 'b') {
        this.writeBytes(item);
      }
      else {
        this.writeBytes(serializer.encodeRecordData(item));
      }
      this.writeBoolean(true);
    }

    // deletes
    total = this.data.deletes.length;

    for (i = 0; i < total; i++) {
      item = this.data.deletes[i];
      this.writeByte(1); // mark the start of an entry.
      this.writeByte(2); // delete
      this.writeShort(item['@rid'].cluster);
      this.writeLong(item['@rid'].position);
      this.writeByte(constants.RECORD_TYPES[item['@type'] || 'd'] || 100); // document by default
      this.writeInt(item['@version'] || 0);
    }
    this.writeByte(0); // no more documents
    this.writeString('');
  },
  reader: function () {
    this
      .readStatus('status')
      .readInt('totalCreated')
      .readArray('created', function (data) {
        var items = [],
          i;
        for (i = 0; i < data.totalCreated; i++) {
          items.push(function () {
            this
              .readShort('tmpCluster')
              .readLong('tmpPosition')
              .readShort('cluster')
              .readLong('position');
          });
        }
        return items;
      })
      .readInt('totalUpdated')
      .readArray('updated', function (data) {
        var items = [],
          i;
        for (i = 0; i < data.totalUpdated; i++) {
          items.push(function () {
            this
              .readShort('cluster')
              .readLong('position')
              .readInt('version');
          });
        }
        return items;
      });

    this.readInt('totalChanges')
      .readArray('changes', function (data) {
        var items = [],
          i;
        for (i = 0; i < data.totalChanges; i++) {
          items.push(function () {
            this
              .readLong('uuidHigh')
              .readLong('uuidLow')
              .readLong('fileId')
              .readLong('pageIndex')
              .readInt('pageOffset');
          });
        }
        return items;
      });
  }
});
