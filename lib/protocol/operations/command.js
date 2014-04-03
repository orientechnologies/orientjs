var Operation = require('../operation'),
    constants = require('../constants'),
    serializer = require('../serializer'),
    deserializer = require('../deserializer'),
    writer = require('../writer');

module.exports = Operation.extend({
  id: 'REQUEST_COMMAND',
  opCode: 41,
  writer: function () {
    if (this.data.mode === 'a') {
      this.data.class = 'com.orientechnologies.orient.core.sql.query.OSQLAsynchQuery';
    }
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId || -1)
    .writeChar(this.data.mode || 's')
    .writeBytes(this.serializeQuery());

  },
  serializeQuery: function () {
    var buffers = [
      writer.writeString(this.data.class),
      writer.writeString(this.data.query)
    ];
    if (this.data.class === 'com.orientechnologies.orient.core.sql.query.OSQLSynchQuery' || this.data.class === 'com.orientechnologies.orient.core.sql.query.OSQLAsynchQuery') {
      buffers.push(
        writer.writeInt(this.data.limit),
        writer.writeString(this.data.fetchPlan || '')
      );

      if (this.data.params) {
        buffers.push(writer.writeString(serializer.serializeDocument(this.data.params)));
      }
      else {
        buffers.push(writer.writeInt(0));
      }
    }
    else {
      if (this.data.params) {
        buffers.push(
          writer.writeBoolean(true),
          writer.writeString(serializer.serializeDocument(this.data.params))
        );
      }
      else {
        buffers.push(writer.writeBoolean(false));
      }
      buffers.push(writer.writeBoolean(false));
    }
    return Buffer.concat(buffers);
  },
  reader: function () {
    this
    .readStatus('status')
    .readCommandResult('results');
  },
  readCommandResult: function (fieldName, reader) {
    this.payloads = [];
    this.readOps.push(function (data) {
      data[fieldName] = this.payloads;
      this.stack.push(data[fieldName]);
      this.readPayload('payloadStatus', function () {
        this.stack.pop();
      });
    });
    return this;
  },
  readPayload: function (payloadFieldName, reader) {

    return this.readByte(payloadFieldName, function (data, fieldName) {
      var record = {};
      switch (data[fieldName]) {
        case 0:
          if (reader) {
            reader.call(this);
          }
          break;
        case 110: // null
          record.type = 'r';
          record.content = null;
          this.payloads.push(record);
          this.readPayload(payloadFieldName, reader);
          break;
        case 1:
        case 114:
          // a record
          record.type = 'r';
          this.payloads.push(record);
          this.stack.push(record);
          this.readRecord('content', function () {
            this.stack.pop();
            this.readPayload(payloadFieldName, reader);
          });
          break;
        case 2:
          // prefeteched record
          record.type = 'p';
          this.payloads.push(record);
          this.stack.push(record);
          this.readRecord('content', function (data) {
            this.stack.pop();
            this.readPayload(payloadFieldName, reader);
          });
          break;
        case 97:
          // serialized result
          record.type = 'f';
          this.payloads.push(record);
          this.stack.push(record);
          this.readString('content', function () {
            this.stack.pop();
            this.readPayload(payloadFieldName, reader);
          });
          break;
        case 108:
          // collection of records
          record.type = 'l';
          this.payloads.push(record);
          this.stack.push(record);
          this.readCollection('content', function (data) {
            this.stack.pop();
            this.readPayload(payloadFieldName, reader);
          });
          break;
        default:
          reader.call(this);
      }
    });
  }
});

