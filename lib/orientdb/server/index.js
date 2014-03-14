var OperationQueue = require('../protocol/operation-queue'),
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
  this.ops = new OperationQueue();
  this.ops.on('update-config', function (config) {
    this.logger.debug('updating config...');
    this.serverCluster = config;
  }.bind(this));

  this.configureLogger(options.logger || {});
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
  if (this.socket && this.sessionId !== -1)
    return Promise.resolve(this);

  if (this.connecting) {
    return this.connecting.return(this);
  }

  this.connecting = this.createSocket()
  .negotiateConnection()
  .bind(this)
  .then(function () {
    return this.send('connect', {
      username: this.username,
      password: this.password
    });
  })
  .return(this);

  return this.connecting;
};

/**
 * Create the server socket connection.
 */
Server.prototype.createSocket = function () {
  this.socket = net.createConnection(this.port, this.host);
  this.socket.setNoDelay(true);
  return this;
};


/**
 * Negotiate a connection for a socket.
 *
 * @promise {Server} The server with connected socket.
 */
Server.prototype.negotiateConnection = function () {
  return new Promise(function (resolve, reject) {
    this.logger.debug('negotiating connection to ' + this.host + ':' + this.port);
    this.socket.once('connect', function () {
      this.logger.debug('connection established');
      this.socket.removeAllListeners();
      this.negotiateProtocol(this.socket)
      .bind(this)
      .then(function () {
        this.bindToSocket();
        this.ops.bindToSocket(this.socket);
        return this.ops.add('connect', {
          username: this.username,
          password: this.password
        });
      })
      .then(function (response) {
        this.sessionId = response.sessionId;
        this.logger.debug('got session id: ' + response.sessionId);
        return this;
      })
      .done(resolve, reject);
    }.bind(this));

    this.socket.once('error', function (err) {
      this.logger.debug('connection error during negotiation: ' + err);
      this.socket.removeAllListeners();
      this.connecting = false;
      reject(new errors.Connection(err.code, err.message));
    }.bind(this));

    this.socket.once('close', function (err) {
      this.logger.debug('connection closed during negotiation: ' + err);
      this.socket.removeAllListeners();
      this.connecting = false;
      if (err)
        reject(new errors.Connection(err.code, err.message));
      else
        reject(new errors.Connection(0, 'Socket Closed'));
    }.bind(this));

  }.bind(this));
};

/**
 * Bind to events on the socket.
 */
Server.prototype.bindToSocket = function () {
  this.socket.on('error', function (err) {
    err = new errors.Connection(2, err ? (err.message || err) : 'Socket Error.');
    this.ops.cancel(err);
    this.unbindFromSocket();
    this.emit('error', err);
  }.bind(this));
  this.socket.on('close', function (err) {
    this.ops.cancel(new errors.Connection(3, err || 'Connection Closed.'));
    this.unbindFromSocket();
    this.emit('close');
  }.bind(this))
  this.socket.on('end', function (err) {
    if (this.closing) {
      this.closing = false;
      this.unbindFromSocket();
      return;
    }
    err = new errors.Connection(1, err || 'Remote server closed the connection.');

    this.ops.cancel(err);

    this.unbindFromSocket();
    this.emit('error', err);
  }.bind(this));
};

/**
 * Reset the session id and unbind from the socket.
 */
Server.prototype.unbindFromSocket = function () {
  if (this.ops)
    delete this.ops.socket;
  this.socket.removeAllListeners();
  delete this.socket;
  delete this.sessionId;
  this.connecting = false;
};

/**
 * Negotiate the orientdb server protocol.
 *
 * @promise {Server} The server instance.
 */
Server.prototype.negotiateProtocol = function () {
  var deferred = Promise.defer();
  this.socket.once('data', function (data) {
    this.socket.removeAllListeners('error');
    this.protocolVersion = data.readUInt16BE(0);
    this.logger.debug('server protocol: ' + this.protocolVersion);
    deferred.resolve(this);
    this.connecting = false;
    this.emit('connect');
    if (data.length > 2) {
      process.nextTick(function () {
        var remainingData = new Buffer(data.length - 2);
        data.copy(remainingData, 0, 2);
        if (remainingData.length) {
          this.handleData(this.socket, remainingData);
        }
      }.bind(this));
    }
  }.bind(this));

  this.socket.once('error', function (err) {
    this.connecting = false;
    this.logger.debug('error in protocol negotiation: ' + err);
    this.socket.removeAllListeners();
    deferred.reject(new errors.Connection(err.code, err.message));
  }.bind(this));

  return deferred.promise;
};

/**
 * Send an operation to the server,
 *
 * @param  {Integer} operation The id of the operation to send.
 * @param  {Object} options    The options for the operation.
 * @promise {Mixed}            The result of the operation.
 */
Server.prototype.send = function (operation, options) {
  return this.connect()
  .bind(this)
  .then(function () {
    options = options || {};
    options.sessionId = options.sessionId || this.sessionId || -1;
    return this.ops.add(operation, options);
  });
};

/**
 * Close the connection to the server.
 *
 * @return {Server} the disconnected server instance
 */
Server.prototype.close = function () {
  if (!this.closing && this.socket) {
    this.socket.end();
    this.socket.removeAllListeners();
    this.closing = false;
    this.sessionId = null;
    delete this.socket;
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
      type: 'document',
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
    config.type = 'document';

  if (config.storage !== 'local' && config.storage !== 'plocal' && config.storage !== 'memory')
    config.storage = 'plocal';

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

  return this.send('db-delete', config)
  .return(true);
};

// deprecated name
Server.prototype.drop = Server.prototype.destroy;

/**
 * List all the databases on the server.
 *
 * @return {Object} The database list
 */
Server.prototype.list = function () {
  return this.send('db-list')
  .then(function (results) {
    var names = Object.keys(results.databases),
        total = names.length,
        databases = {},
        name, i, db, cs;

    for (i = 0; i < total; i++) {
      name = names[i];
      cs = results.databases[name];
      databases[name] = new Db({
        server: this,
        name: name,
        storage: cs.match(/^(.+):/)[1]
      });
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
