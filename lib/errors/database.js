"use strict";

var OrientDBError = require('./base');

module.exports = OrientDBError.inherit(function ODatabaseError (code, message, data) {
  this.name = 'OrientDB.DatabaseError [' + code + ']';
  this.code = code;
  this.message = message;
  this.data = data || {};
});