"use strict";

var OrientDBError = require('./base');

module.exports = OrientDBError.inherit(function ProtocolError (message, data) {
  this.name = 'OrientDB.ProtocolError';
  this.message = message;
  this.data = data || {};
});