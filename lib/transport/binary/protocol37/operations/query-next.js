/*jshint esversion: 6 */
"use strict";

const Operation = require('../operations/query'),
  constants = require('../constants'),
  serializer = require('../serializer'),
  writer = require('../writer'),
  RID = require('../../../../recordid'),
  utils = require('../../../../utils');


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
