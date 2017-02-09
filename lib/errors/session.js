"use strict";

var OrientDBError = require('./base');

module.exports = OrientDBError.inherit(function SessionError (code, message, data) {
  this.name = 'OrientDB.SessionError [' + code + ']';
  this.code = code;
  this.message = message;
  this.data = data || {};
});