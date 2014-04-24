"use strict";

var OrientDBError = require('./base');

module.exports = OrientDBError.inherit(function ConnectionError (code, message, data) {
  this.name = 'OrientDB.ConnectionError [' + code + ']';
  this.code = code;
  this.message = message;
  this.data = data || {};
});