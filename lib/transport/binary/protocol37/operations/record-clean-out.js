"use strict";

var Operation = require('../operation'),
    constants = require('../constants'),
    RID = require('../../../../recordid'),
    serializer = require('../serializer');

module.exports = Operation.extend({
  id: 'REQUEST_RECORD_CLEAN_OUT',
  opCode: 38,
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
    .writeHeader(this.opCode, this.data.sessionId, this.data.token)
    .writeShort(cluster)
    .writeLong(position)
    .writeInt(this.data.version || -1)
    .writeBoolean(this.data.mode);
  },
  reader: function () {
    this
    .readStatus('status')
    .readBoolean('success');
  }
});