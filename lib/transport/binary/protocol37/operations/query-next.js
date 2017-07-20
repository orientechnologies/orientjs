/*jshint esversion: 6 */
"use strict";

const Operation = require('../operations/query'),
  serializer = require('../serializer'),
  writer = require('../writer');


module.exports = Operation.extend({
  id: 'REQUEST_QUERY_NEXT_PAGE',
  opCode: 47,
  writer: function () {
    this
      .writeHeader(this.opCode, this.data.sessionId, this.data.token)
      .writeString(this.data.queryId)
      .writeInt(this.data.pageSize || 100);
  },
});
