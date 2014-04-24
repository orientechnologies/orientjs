"use strict";

var OrientDBError = require('./base');

module.exports = OrientDBError.inherit(function OperationError (message, data) {
  this.name = 'OrientDB.OperationError';
  this.message = message;
  this.data = data || {};
});