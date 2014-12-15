"use strict";
var Operation = require('../operation'),
    constants = require('../constants'),
    npmPackage = require('../../../../../package.json');

module.exports = Operation.extend({
  id: 'REQUEST_DB_OPEN',
  opCode: 3,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId || -1)
    .writeString(npmPackage.name)
    .writeString(npmPackage.version)
    .writeShort(+constants.PROTOCOL_VERSION)
    .writeString('') // client id
    .writeString('ORecordDocument2csv') // serialization format
    .writeBoolean(this.data.useToken) // tokens please!
    .writeString(this.data.name)
    .writeString(this.data.type)
    .writeString(this.data.username)
    .writeString(this.data.password);
  },
  reader: function () {
    this
    .readStatus('status')
    .readInt('sessionId')
    .readBytes('token');

    this
    .readShort('totalClusters')
    .readArray('clusters', function (data) {
      var clusters = [],
          total = data.totalClusters,
          i;

      for (i = 0; i < total; i++) {
        clusters.push(function (data) {
          this.readString('name')
          .readShort('id');
        });
      }
      return clusters;
    })
    .readObject('serverCluster')
    .readString('release');
  }
});