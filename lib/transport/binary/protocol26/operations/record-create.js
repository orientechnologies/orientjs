"use strict";

var Operation = require('../operation'),
    constants = require('../constants'),
    RID = require('../../../../recordid'),
    serializer = require('../serializer');

module.exports = Operation.extend({
  id: 'REQUEST_RECORD_CREATE',
  opCode: 31,
  writer: function () {
    var rid, cluster;
    if (this.data.record['@rid']) {
      rid = RID.parse(this.data.record['@rid']);
      cluster = this.data.cluster || rid.cluster;
    }
    else {
      cluster = this.data.cluster;
    }
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeShort(cluster)
    .writeBytes(serializer.encodeRecordData(this.data.record))
    .writeByte(constants.RECORD_TYPES[this.data.type || 'd'])
    .writeByte(this.data.mode || 0);
  },
  reader: function () {
    this
    .readStatus('status')
    .readShort('cluster')
    .readLong('position')
    .readInt('version')
    .readInt('totalChanges')
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