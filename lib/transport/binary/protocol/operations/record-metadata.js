"use strict";

var Operation = require('../operation'),
    constants = require('../constants'),
    RID = require('../../../../recordid'),
    serializer = require('../serializer');

module.exports = Operation.extend({
  id: 'REQUEST_RECORD_METADATA',
  opCode: 29,
  writer: function () {
    var rid, cluster, position;
    if (this.data.record && this.data.record['@rid']) {
      rid = RID.parse(this.data.record['@rid']);
      cluster = this.data.cluster || rid.cluster;
      position = this.data.position || rid.position;
    }
    else {
      cluster = this.data.cluster;
      position = this.data.position;
    }
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeShort(cluster)
    .writeLong(position);
  },
  reader: function () {
    this
    .readStatus('status')
    .readShort('cluster')
    .readLong('position')
    .readInt('version');
  }
});