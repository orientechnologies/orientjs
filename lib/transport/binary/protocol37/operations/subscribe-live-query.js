/*jshint esversion: 6 */
"use strict";

const Operation = require('./subscribe-push');
const constants = require('../constants');
const serializer = require('../serializer');

module.exports = Operation.extend({
  writer: function () {
    const isNamed = (this.data.params && this.data.params.params) ? !Array.isArray(this.data.params.params) : true;
    this.writeHeader(this.opCode, this.data.sessionId, this.data.token)
      .writeByte(2)
      .writeString(this.data.query)
      .writeBytes(this.serializeParams())
      .writeBoolean(isNamed); // is Named params
  },
  serializeParams: function () {
    let content;
    if (this.data.params && this.data.params.params && Object.keys(this.data.params.params).length > 0) {
      let doc = {
        params: this.data.params.params
      };
      content = serializer.serializeDocument(doc);
    } else {
      content = new Buffer(0);
    }
    return content;
  },

  reader(){
    this
      .readStatus('status');
    this.readInt("monitorId");
  }
});