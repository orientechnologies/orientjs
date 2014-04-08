var ConnectionPool = require('./connection-pool'),
    Connection = require('./connection'),
    utils = require('../utils'),
    errors = require('../errors'),
    Db = require('../db/index'),
    Promise = require('bluebird'),
    net = require('net'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

/**
 * # Server
 * Represents a connection to an orientdb server.
 *
 * @param {String|Object} options The server URL, or configuration object
 */
function Server (options) {
  this.applySettings(options || {});
  this.init();

  this.augment('config', require('./config'));
  EventEmitter.call(this);
  this.setMaxListeners(Infinity);
}

util.inherits(Server, EventEmitter);

Server.extend = utils.extend;
Server.prototype.augment = utils.augment;


module.exports = Server;



/**
 * Configure the server instance.
 *
 * @param  {Object} config The configuration for the server.
 * @return {Server}            The configured server object.
 */
Server.prototype.applySettings = function (options) {

  this.connecting = false;
  this.closing = false;

  this.host = options.host || options.hostname || 'localhost';
  this.port = options.port || 2424;
  this.username = options.username || 'root';
  this.password = options.password || '';

  this.sessionId = -1;
  this.configureLogger(options.logger || {});
  if (options.pool) {
    this.configurePool(options.pool);
  }
  else {
    this.configureConnection();
  }
};

/**
 * Configure the logger for the server.
 *
 * @param  {Object} config The logger config
 * @return {Server}        The server instance with the configured logger.
 */
Server.prototype.configureLogger = function (config) {
  this.logger = {
    error: config.error || console.error.bind(console),
    log: config.log || console.log.bind(console),
    debug: config.debug || function () {} // do not log debug by default
  };
  return this;
};


/**
 * Configure a connection for the server.
 *
 * @return {Server}        The server instance with the configured connection.
 */
Server.prototype.configureConnection = function () {
  this.connection = new Connection({
    host: this.host,
    port: this.port,
    logger: this.logger
  });
  this.connection.on('update-config', function (config) {
    this.logger.debug('updating config...');
    this.serverCluster = config;
  }.bind(this));
  return this;
};

/**
 * Configure a connection pool for the server.
 *
 * @param  {Object} config The connection pool config
 * @return {Server}        The server instance with the configured connection pool.
 */
Server.prototype.configurePool = function (config) {
  this.pool = new ConnectionPool({
    host: this.host,
    port: this.port,
    logger: this.logger,
    max: config.max
  });
  this.pool.on('update-config', function (config) {
    this.logger.debug('updating config...');
    this.serverCluster = config;
  }.bind(this));
  return this;
};


/**
 * Initialize the server instance.
 */
Server.prototype.init = function () {

};

/**
 * Connect to the server.
 *
 * @promise {Server} The connected server instance.
 */
Server.prototype.connect = function () {
  if (this.sessionId !== -1)
    return Promise.resolve(this);

  if (this.connecting) {
    return this.connecting;
  }

  this.connecting = (this.pool || this.connection).send('connect', {
    username: this.username,
    password: this.password
  })
  .bind(this)
  .then(function (response) {
    this.logger.debug('got session id: ' + response.sessionId);
    this.sessionId = response.sessionId;
    return this;
  });

  return this.connecting;
};

/**
 * Send an operation to the server,
 *
 * @param  {Integer} operation The id of the operation to send.
 * @param  {Object} options    The options for the operation.
 * @promise {Mixed}            The result of the operation.
 */
Server.prototype.send = function (operation, options) {
  options = options || {};
  if (~this.sessionId) {
    options.sessionId = options.sessionId != null ? options.sessionId : this.sessionId;
    return (this.pool || this.connection).send(operation, options);
  }
  else {
    return this.connect()
    .then(function (server) {
      options.sessionId = options.sessionId != null ? options.sessionId : this.sessionId;
      return (server.pool || server.connection).send(operation, options);
    });
  }
};

/**
 * Close the connection to the server.
 *
 * @return {Server} the disconnected server instance
 */
Server.prototype.close = function () {
  if (!this.closing && this.socket) {
    this.closing = false;
    this.sessionId = -1;
  }
  return this;
}

// # Database Related Methods

/**
 * Use the database with the given name / config.
 *
 * @param  {String|Object} config The database name, or configuration object.
 * @return {Db}                   The database instance.
 */
Server.prototype.use = function (config) {
  if (!config) throw new errors.Config('Cannot use a database without a name.');

  if (typeof config === 'string') {
    config = {
      name: config,
      server: this
    };
  }
  else {
    config.server = this;
  }

  if (!config.name) throw new errors.Config('Cannot use a database without a name.');

  return new Db(config);
};

/**
 * Create a database with the given name / config.
 *
 * @param  {String|Object} config The database name or configuration object.
 * @promise {Db}                  The database instance
 */
Server.prototype.create = function (config) {
  config = config || '';

  if (typeof config === 'string' || typeof config === 'number') {
    config = {
      name: ''+config,
      type: 'graph',
      storage: 'plocal'
    };
  }
  else {
    config = {
      name: config.name || config.name,
      type: (config.type || config.type),
      storage: config.storage || config.storage || 'plocal'
    };
  }

  if (!config.name) {
    return Promise.reject(new errors.Config('Cannot create database, no name specified.'));
  }

  if (config.type !== 'document' && config.type !== 'graph')
    config.type = 'graph';

  if (config.storage !== 'local' && config.storage !== 'plocal' && config.storage !== 'memory') {
    config.storage = 'plocal';
  }
  this.logger.debug('Creating database ' + config.name);

  return this.send('db-create', config)
  .bind(this)
  .then(function (response) {
    config.server = this;
    return new Db(config);
  });
};

/**
 * Destroy a database with the given name / config.
 *
 * @param   {String|Object} config The database name or configuration object.
 * @promise {Mixed}               The server response.
 */
Server.prototype.delete = function (config) {
  config = config || '';

  if (typeof config === 'string' || typeof config === 'number') {
    config = {
      name: ''+config,
      storage: 'plocal'
    };
  }
  else {
    config = {
      name: config.name || config.name,
      storage: config.storage || config.storage || 'plocal'
    };
  }

  if (!config.name) {
    return Promise.reject(new errors.Config('Cannot destroy, no database specified.'));
  }
  this.logger.debug('Deleting database ' + config.name);
  return this.send('db-delete', config)
  .return(true);
};

// deprecated name
Server.prototype.drop = Server.prototype.delete;

/**
 * List all the databases on the server.
 *
 * @return {Db[]} An array of databases.
 */
Server.prototype.list = function () {
  return this.send('db-list')
  .then(function (results) {
    var names = Object.keys(results.databases),
        total = names.length,
        databases = [],
        name, i, db, cs;

    for (i = 0; i < total; i++) {
      name = names[i];
      cs = results.databases[name];
      databases.push(new Db({
        server: this,
        name: name,
        storage: cs.match(/^(.+):/)[1]
      }));
    }

    return databases;
  });
};

/**
 * Determine whether a database exists with the given name.
 *
 * @param   {String} name        The database name.
 * @param   {String} storageType The storage type, defaults to `local`.
 * @promise {Boolean}            true if the database exists.
 */
Server.prototype.exists = function (name, storageType) {
  var config;
  if (typeof name === 'object' && name.name) {
    config = name;
    name = config.name;
    storageType = storageType || config.storage;
  }
  storageType = storageType || 'plocal';
  return this.send('db-exists', {
    name: (''+name).toLowerCase(),
    storage: storageType.toLowerCase()
  })
  .then(function (response) {
    return response.exists;
  });
};

// deprecated name
Server.prototype.exist = Server.prototype.exists;

/**
 * Freeze the database with the given name.
 *
 * @param  {String} databaseName The name of the database to freeze.
 * @return {Object}              The response from the server.
 */
Server.prototype.freeze = function (databaseName) {
  // @todo implementation
  throw new Error('Not yet implemented!');
};

/**
 * Release the database with the given name.
 *
 * @param  {String} databaseName The name of the database to release.
 * @return {Object}              The response from the server.
 */
Server.prototype.release = function (databaseName) {
  // @todo implementation
  throw new Error('Not yet implemented!');
};
