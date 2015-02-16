"use strict";

var utils = require('../utils');

/**
 * Base class for CLI commands.
 *
 * @param {Server} server  The server instance.
 * @param {Object} options The opptions for the command.
 */
function Command (server, options) {
  this.server = server;
  this.options = options;
  // Get / Set the database to use for the migrations.
  Object.defineProperty(this, 'db', {
    get: function () {
      if (!this._db && this.options.dbname) {
        this._db = this.server.use({
          name: this.options.dbname,
          username: this.options.dbuser,
          password: this.options.dbpassword
        });
      }
      return this._db;
    },
    set: function (val) {
      if (typeof val === 'string') {
        val = this.server.use(val);
      }
      this._db = val;
    }
  });

}

/**
 * The required CLI arguments for the command.
 * @type {Array}
 */
Command.prototype.requiredArgv = ['password'];

/**
 * Run the command.
 * @promise {Mixed} The result of the command.
 */
Command.prototype.run = function () {
  var subcommand = this.options._[1];
  if (!subcommand || subcommand === 'run' || typeof this[subcommand] !== 'function') {
    return this.help();
  }
  else {
    return this[subcommand].apply(this, this.options._.slice(2));
  }
};

/**
 * Show the help for the command.
 */
Command.prototype.help = function () {
  return require('yargs').showHelp();
};


Command.extend = utils.extend;
module.exports = Command;
