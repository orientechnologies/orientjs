/*jshint esversion: 6 */
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
      .writeInt(this.data.txId);
    let hasContent = (this.data.creates.length + this.data.updates.length + this.data.deletes.length) > 0;
    this.writeByte(hasContent) // has content
      .writeByte(this.data.txLog); // use transaction log
    this.writeRecords();
    this.writeIndexChanges();
  },

  writeRecords: function () {
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
      this.writeBytes(serializer.encodeRecordData(item));
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
      this.writeBytes(serializer.encodeRecordData(item));
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

  },

  writeIndexChanges: function () {
    this.writeString('');
  },
  reader: function () {
    this
      .readStatus('status');

    this.readRecords();
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
  },
  readRecords: function () {
    this.readInt('totalCreated');
    this.readArray('created', function (data) {
      var items = [],
        i;
      for (i = 0; i < data.totalCreated; i++) {
        items.push(function () {
          this
            .readShort('tmpCluster')
            .readLong('tmpPosition')
            .readShort('cluster')
            .readLong('position')
            .readInt('version');
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
      })
      .readInt('totalDeleted')
      .readArray('deleted', function (data) {
        var items = [],
          i;
        for (i = 0; i < data.totalDeleted; i++) {
          items.push(function () {
            this
              .readShort('cluster')
              .readLong('position');
          });
        }
        return items;
      });
  }

});