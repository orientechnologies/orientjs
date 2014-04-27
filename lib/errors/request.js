"use strict";

var OperationError = require('./operation');

module.exports = OperationError.inherit(function RequestError (message, data) {
  this.name = 'OrientDB.RequestError';
  this.message = message;
  this.data = data || {};
});