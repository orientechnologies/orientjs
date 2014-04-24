"use strict";

var OrientDBError = require('./base');

module.exports = OrientDBError.inherit(function RecordError (code, message, data) {
  this.name = 'OrientDB.RecordError [' + code + ']';
  this.code = code;
  this.message = message;
  this.data = data || {};
});