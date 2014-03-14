var Operation = require('../operation'),
    constants = require('../constants'),
    RID = require('../../recordid'),
    serializer = require('../serializer'),
    deserializer = require('../deserializer'),
    errors = require('../../errors');

module.exports = Operation.extend({
  id: 'REQUEST_RECORD_LOAD',
  opCode: 30,
  writer: function () {
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId)
    .writeShort(this.data.cluster)
    .writeLong(this.data.position)
    .writeString(this.data.fetchPlan || '')
    .writeByte(this.data.ignoreCache || 0)
    .writeByte(this.data.tombstones || 0);
  },
  reader: function () {
    var records = [];
    this.readStatus('status');
    this.readOps.push(function (data) {
      data.records = records;
      this.stack.push(data.records);
      readItem.call(this, function () {
        this.stack.pop();
        data.records = data.records.map(function (record) {
          var r;
          if (record.type === 'd') {
            r = record.content || {};
            r['@rid'] = new RID({
              cluster: this.data.cluster,
              position: this.data.position
            });
            r['@version'] = record.version;
            r['@type'] = record.type;
          }
          else {
            r = {
              '@rid': new RID({
                cluster: this.data.cluster,
                position: this.data.position
              }),
              '@version': record.version,
              '@type': record.type,
              value: record.content
            };

          }
          return r;
        }, this);
      });
    });

    function readItem (ender) {
      this.readByte('payloadStatus', function (data, fieldName) {
        var record = {};
        switch (data[fieldName]) {
          case 0:
            // nothing to do.
            if (ender) {
              ender.call(this);
            }
            break;
          case 1:
            // a record
            records.push(record);
            this.stack.push(record);
            this
            .readString('content')
            .readInt('version')
            .readByte('type', function (data, fieldName) {
              data[fieldName] = String.fromCharCode(data[fieldName]);
              if (data[fieldName] === 'd') {
                data.content = deserializer.deserializeValue('{' + record.content + '}');
              }
              this.stack.pop();
              readItem.call(this, ender);
            })
            break;
          default:
            throw new errors.Protocol('Payload status of ' + data[fieldName] + ' is not supported');
        }
      });
    }
  }
});