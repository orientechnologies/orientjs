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
    .writeInt(this.data.segment || -1)
    .writeShort(cluster)
    .writeBytes(serializer.encodeRecordData(this.data.record))
    .writeByte(constants.RECORD_TYPES[this.data.type || 'd'])
    .writeByte(this.data.mode || 0);
  },
  reader: function () {
    this
    .readStatus('status')
    .readLong('position')
    .readInt('version');
  }
});