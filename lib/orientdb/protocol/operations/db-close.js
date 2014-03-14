var Operation = require('../operation'),
    constants = require('../constants'),
    npmPackage = require('../../../../package.json');

module.exports = Operation.extend({
  id: 'REQUEST_DB_CLOSE',
  opCode: 5,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId || -1)
  },
  reader: function () {
  }
});