"use strict";

var Operation = require('../operation'),
    constants = require('../constants'),
    npmPackage = require('../../../../../package.json');

module.exports = Operation.extend({
  id: 'REQUEST_CONNECT',
  opCode: 2,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId || -1)
    .writeString(npmPackage.name)
    .writeString(npmPackage.version)
    .writeShort(+constants.PROTOCOL_VERSION)
    .writeString('') // client id
    .writeString(constants.SERIALIZATION_FORMAT) // serialization format
    .writeBoolean(this.data.useToken) // use JWT?
    .writeString(this.data.username)
    .writeString(this.data.password);
  },
  reader: function () {
    this
    .readStatus('status')
    .readInt('sessionId')
    .readBytes('token');
  }
});