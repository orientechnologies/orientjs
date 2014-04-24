"use strict";

var Promise = require('bluebird'),
    errors = require('../errors'),
    utils = require('../utils'),
    Manager = require('./manager');

/**
 * # Migrations
 * The migration constructor.
 *
 * @param {Object} config The configuration for the migration.
 */
function Migration (config) {
  this.name = '';
  this.server = null;
  this.db = null;
  if (config) {
    this.configure(config);
  }
}

Migration.extend = utils.extend;

Migration.Manager = Manager;

module.exports = Migration;

/**
 * Configure the migration.
 *
 * @param  {Object}    config The configuration object.
 * @return {Migration}        The migration instance.
 */
Migration.prototype.configure = function (config) {
  var keys = Object.keys(config),
      total = keys.length,
      key, i;

  for (i = 0; i < total; i++) {
    key = keys[i];
    this[key] = config[key];
  }
  return this;
};


/**
 * Perform the migration.
 *
 * @promise {Mixed} The result of the migration.
 */
Migration.prototype.up = function () {
  return Promise.reject(new errors.Operation('Migration "' + this.name + '" does not support up()'));
};


/**
 * Revert the migration.
 *
 * @promise {Mixed} The result of the migration.
 */
Migration.prototype.down = function () {
  return Promise.reject(new errors.Operation('Migration "' + this.name + '" does not support down()'));
};

