"use strict";

var Operation = require('../operation'),
    constants = require('../constants'),
    serializer = require('../serializer'),
    writer = require('../writer'),
    RID = require('../../../../recordid'),
    utils = require('../../../../utils');

module.exports = Operation.extend({
  id: 'REQUEST_COMMAND',
  opCode: 41,
  writer: function () {
    if (this.data.mode === 'a' && !this.data.class) {
      this.data.class = 'com.orientechnologies.orient.core.sql.query.OSQLAsynchQuery';
    }
    this
    .writeByte(this.opCode)
    .writeInt(this.data.sessionId || -1)
    .writeChar(this.data.mode || 's')
    .writeBytes(this.serializeQuery());

  },
  serializeQuery: function () {
    var buffers = [writer.writeString(this.data.class)];

    var text = this.data.query;
    // if there are bound parameters, force prepare them, OrientDB's support is limited in this version.
    if (this.data.params && this.data.params.params) {
      text = utils.prepare(text, this.data.params.params);
    }

    if (this.data.class === 'q' ||
        this.data.class === 'com.orientechnologies.orient.core.sql.query.OSQLSynchQuery' ||
        this.data.class === 'com.orientechnologies.orient.core.sql.query.OSQLAsynchQuery') {
      buffers.push(
        writer.writeString(text),
        writer.writeInt(this.data.limit),
        writer.writeString(this.data.fetchPlan || '')
      );

      buffers.push(writer.writeInt(0));
    }
    else if (
        this.data.class === 's' ||
        this.data.class === 'com.orientechnologies.orient.core.command.script.OCommandScript') {
      buffers.push(
        writer.writeString(this.data.language || 'sql'),
        writer.writeString(text)
      );
      buffers.push(writer.writeBoolean(false));
      buffers.push(writer.writeByte(0));
    }
    else {
      buffers.push(writer.writeString(text));
      buffers.push(writer.writeBoolean(false));
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

/**
 * Serialize the parameters for a query.
 *
 * > Note: There is a bug in OrientDB where special kinds of string values
 * > need to be twice quoted *in parameters*. Hence the need for this specialist function.
 *
 * @param  {Object} data The data to serialize.
 * @return {String}      The serialized data.
 */
function serializeParams (data) {
  var keys = Object.keys(data.params || {}),
      total = keys.length,
      c, i, key, value;

  for (i = 0; i < total; i++) {
    key = keys[i];
    value = data.params[key];
    if (typeof value === 'string') {
      c = value.charAt(0);
      if (c === '.' || c === '#' || c === '<' || c === '[' || c === '(' || c === '{' || c === '0' || +c) {
        data.params[key] = '"' + value + '"';
      }
    }
  }
  return serializer.serializeDocument(data);
}