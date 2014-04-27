var Operation = require('../operation'),
    constants = require('../constants');

module.exports = Operation.extend({
  id: 'REQUEST_DB_FREEZE',
  opCode: 94,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeString(this.data.name);
  },
  reader: function () {
    this.readStatus('status');
  }
});
