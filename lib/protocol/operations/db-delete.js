var Operation = require('../operation'),
    constants = require('../constants'),
    npmPackage = require('../../../../package.json');

module.exports = Operation.extend({
  id: 'REQUEST_DB_DROP',
  opCode: 7,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeString(this.data.name)
    .writeString(this.data.storage || 'local');
  },
  reader: function () {
    this.readStatus('status');
  }
});