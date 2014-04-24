"use strict";

var Operation = require('../operation'),
    constants = require('../constants'),
    RID = require('../../../../recordid'),
    serializer = require('../serializer');

module.exports = Operation.extend({
  id: 'REQUEST_RECORD_DELETE',
  opCode: 33,
  writer: function () {
    var rid, cluster, position, version;
    if (this.data.record && this.data.record['@rid']) {
      rid = RID.parse(this.data.record['@rid']);
      cluster = this.data.cluster || rid.cluster;
      position = this.data.position || rid.position;
    }
    else {
      cluster = this.data.cluster;
      position = this.data.position;
    }
    if (this.data.version != null) {
      version = this.data.version;
    }
    else if (this.data.record && this.data.record['@version'] != null) {
      version = this.data.record['@version'];
    }
    else {
      version = -1;
    }
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeShort(cluster)
    .writeLong(position)
    .writeInt(version)
    .writeByte(this.data.mode || 0);
  },
  reader: function () {
    this
    .readStatus('status')
    .readByte('success', function (data, fieldName) {
      data[fieldName] = Boolean(data[fieldName]);
    });
  }
});