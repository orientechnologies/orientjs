"use strict";

var path = require('path'),
    MigrationManager = require('../../migration/manager');

/**
 * The required CLI arguments for the command.
 * @type {Array}
 */
exports.requiredArgv = ['dbname', 'password'];

/**
 * Get the migration manager instance
 * @return {MigrationManager} the migration manger.
 */
exports.manager = function () {
  if (!this._manager) {
    this._manager = new MigrationManager({
      db: this.db,
      dir: path.join(this.options.cwd, 'migrations')
    });
  }
  return this._manager;
};

/**
 * List the available migrations for the database.
 */
exports.list = function () {
  return this.manager().list()
  .then(function (names) {
    console.log('The following migrations are available:');
    names.forEach(function (name) {
      console.log('\t\t' + name);
    });
  });
};

/**
 * List the applied migrations in the database.
 */
exports.applied = function () {
  return this.manager().listApplied()
  .then(function (names) {
    console.log('The following migrations have been applied:');
    names.forEach(function (name) {
      console.log('\t\t' + name);
    });
  });
};

/**
 * Create a new migration.
 */
exports.create = function () {
  var name = Array.prototype.join.call(arguments, ' ');
  if (!name) {
    throw new Error('Name is required');
  }
  console.log('Creating a new migration called: ' + name);
  return this.manager().create(name)
  .then(function (filename) {
    console.log('new migration ' + filename + ' created.');
  });
};

/**
 * Migrate up.
 */
exports.up = function (limit) {
  if (limit) {
    console.log('Applying a maximum of ' + limit + ' migration(s)...');
  }
  else {
    console.log('Applying all available migrations...');
  }
  return this.manager().up(limit)
  .then(function (results) {
    console.log('Applied ' + results.length + ' migration(s):');
    results.forEach(function (item) {
      console.log('\t\t' + item);
    });
  });
};


/**
 * Migrate down.
 */
exports.down = function (limit) {
  if (limit) {
    console.log('Reverting a maximum of ' + limit + ' migration(s)...');
  }
  else {
    console.log('Reverting all available migrations...');
  }
  return this.manager().down(limit)
  .then(function (results) {
    console.log('Reverted ' + results.length + ' migration(s):');
    results.forEach(function (item) {
      console.log('\t\t' + item);
    });
  });
};