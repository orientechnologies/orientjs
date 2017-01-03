"use strict";

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    yargs = require('yargs'),
    Server = require('../server'),
    Command = require('./command');

/**
 * # Command Line Interface
 */
function CLI () {

}

module.exports = CLI;

/**
 * Parse the arguments and run the commmand.
 */
CLI.prototype.run = function (argv) {
  argv = argv || process.argv;
  return this.parseArgv(argv)
  .bind(this)
  .then(function (argv) {
    var command = argv._[0] || 'help',
        total, i;
    if (argv.help || command === 'help') {
      yargs.showHelp();
      return;
    }
    command = this.createCommand(command, argv);
    total = command.requiredArgv.length;
    for (i = 0; i < total; i++) {
      var possibleOpts = command.requiredArgv[i].split('|');
      var found = false;
      for (var j = 0; j < possibleOpts.length; ++j) {
        if (argv[possibleOpts[j]] !== undefined) {
          found = true;
          break;
        }
      }
      if (!found) {
        return command.help();
      }
    }
    return command.run();
  });
};

/**
 * Create the named command.
 *
 * @param  {String}  name The name of the command.
 * @param  {Object}  argv The parsed command line options.
 * @return {Command}      The command instance.
 */
CLI.prototype.createCommand = function (name, argv) {
  var filename = path.join(__dirname, 'commands', name);
  try {
    var Constructor = Command.extend(require(filename)),
        server = this.createServer(argv);


    return new Constructor(server, argv);
  }
  catch (e) {
    yargs.showHelp();
    throw e;
  }
};

/**
 * Create a server instance based on the given arguments.
 * @param  {Object} argv The parsed command line arguments.
 * @return {Server}      The server instance.
 */
CLI.prototype.createServer = function (argv) {
  return new Server({
    host: argv.host,
    port: argv.port,
    username: ''+argv.user,
    password: ''+argv.password
  });
};

/**
 * Parse the command line arguments.
 *
 * @param   {Array}  argv The arguments to parse
 * @promise {Object}      The parsed arguments.
 */
CLI.prototype.parseArgv = function (argv) {
  return this.declareArgv()
  .bind(this)
  .then(function () {
    var interim = yargs.parse(argv);
    if (interim.cwd && interim.cwd.slice(0, 2) === '..' || interim.cwd.slice(0, 2) === './') {
      interim.cwd = path.resolve(process.cwd(), interim.cwd);
    }
    return this.parseOptsFile(path.join(interim.cwd, 'orientjs.opts'))
    .then(function (opts) {
      return argv.slice(0, 2).concat(opts.concat(argv.slice(2)));
    })
    .catch(function () {
      return argv;
    });
  })
  .then(function (argv) {
    argv = yargs.parse(argv.slice(1));

    if (argv.cwd && argv.cwd.slice(0, 2) === '..' || argv.cwd.slice(0, 2) === './') {
      argv.cwd = path.resolve(process.cwd(), argv.cwd);
    }
    return argv;
  });
};

/**
 * Parse a .opts file into raw argv.
 *
 * @param   {String} filename The path to the .opts file.
 * @promise {Array}           The raw arguments.
 */
CLI.prototype.parseOptsFile = function (filename) {
  return fs.readFileAsync(filename, 'utf8')
  .then(function (content) {
    return content.trim().split(/\s+/);
  });
};


/**
 * Declare the accepted command line arguments.
 * @promise {CLI} The cli instance with argv declared.
 */
CLI.prototype.declareArgv = function () {
  return this.list()
  .then(function (names) {
    return yargs
    .usage('Usage: orientjs [OPTIONS] [' + names.join('|') + ']')
    .options({
      d: {
        alias: 'cwd',
        default: process.cwd(),
        description: 'The working directory to use.'
      },
      h: {
        alias: 'host',
        default: 'localhost',
        description: 'The server hostname or IP address.'
      },
      p: {
        alias: 'port',
        default: 2424,
        description: 'The server port.'
      },
      u: {
        alias: 'user',
        default: 'root',
        description: 'The server username.'
      },
      s: {
        alias: 'password',
        description: 'The server password.'
      },
      n: {
        alias: 'dbname',
        description: 'The name of the database to use.'
      },
      U: {
        alias: 'dbuser',
        default: 'admin',
        description: 'The database username.'
      },
      P: {
        alias: 'dbpassword',
        default: 'admin',
        description: 'The database password.'
      },
      '?': {
        alias: 'help',
        description: 'Show this help screen.'
      }
    });
  });
};


/**
 * List the supported commands.
 * @return {String[]} The supported command names.
 */
CLI.prototype.list = function () {
  return fs.readdirAsync(path.join(__dirname, 'commands'))
  .filter(function (filename) {
    return /\.js$/.test(filename);
  })
  .map(function (filename) {
    return filename.slice(0, -3);
  });
};
