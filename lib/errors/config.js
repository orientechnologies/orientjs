"use strict";

var OrientDBError = require('./base');

module.exports = OrientDBError.inherit(function ConfigError (message, data) {
  this.name = 'OrientDB.ConfigError';
  this.message = message;
  this.data = data || {};
});