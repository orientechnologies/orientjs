var _ = require('lodash'),
    utils = require('../utils'),
    errors = require('../errors'),
    Promise = require('bluebird');


/**
 * Database Constructor.
 *
 * @param {Object} config The optional configuration for the database.
 */
function Db (config) {
  if (!config)
    throw new errors.Config('Database object requires configuration');
  this.configure(config);
  this.init();
  this.augment('cluster', require('./cluster'));
  this.augment('class', require('./class'));
  this.augment('record', require('./record'));
}


Db.prototype.augment = utils.augment;
Db.extend = utils.extend;

module.exports = Db;

/**
 * Configure the database instance.
 * @param  {Object} config The configuration for the database.
 * @return {Db}            The configured database object.
 */
Db.prototype.configure = function (config) {
  this.sessionId = -1;
  this.name = config.name;

  this.server = config.server;

  this.type = config.type === 'graph'
              ? 'graph'
              : 'document';

  this.storage = (config.storage === 'plocal' || config.storage === 'memory')
                     ? config.storage
                     : 'plocal';

  this.username = config.username || 'admin';
  this.password = config.password || 'admin';
  this.dataSegments = [];
  this.transactionId = 0;
  return this;
};

/**
 * Initialize the database instance.
 */
Db.prototype.init = function () {

};

/**
 * Open the database.
 *
 * @promise {Db} The open db instance.
 */
Db.prototype.open = function () {
  if (this.sessionId !== -1) {
    return Promise.resolve(this);
  }
  this.server.logger.debug('opening database connection to ' + this.name);
  return this.server.send('db-open', {
    name: this.name,
    type: this.type,
    username: this.username,
    password: this.password
  })
  .bind(this)
  .then(function (response) {
    this.server.logger.debug('got session id ' + response.sessionId + ' for database ' + this.name);
    this.sessionId = response.sessionId;
    this.cluster.cacheData(response.clusters);
    this.serverCluster = response.serverCluster;
    this.server.once('error', function () {
      this.sessionId = null;
    }.bind(this));
    return this;
  });
};

/**
 * Send the given operation to the server, ensuring the
 * database is open first.
 *
 * @param  {Integer} operation The operation to send.
 * @param  {Object} data       The data for the operation.
 * @promise {Mixed}            The result of the operation.
 */
Db.prototype.send = function (operation, data) {
  return this.open()
  .bind(this)
  .then(function () {
    this.server.logger.debug('sending operation ' + operation + ' for database ' + this.name);
    return this.server.send(operation, data);
  });
};


/**
 * Reload the configuration for the database.
 *
 * @promise {Db}  The database with reloaded configuration.
 */
Db.prototype.reload = function () {
  if (this.sessionId === -1)
    return this.open();
  this.server.logger.debug('Reloading database information');
  return this.send('db-reload')
  .bind(this)
  .then(function (response) {
    this.cluster.cacheData(response.clusters);
    return this;
  });
};


/**
 * Execute an SQL query against the database and retreive the raw, parsed response.
 *
 * @param   {String} query   The query or command to execute.
 * @param   {Object} options The options for the query / command.
 * @promise {Mixed}          The results of the query / command.
 */
Db.prototype.exec = function (query, options) {
  var data = {
    query: query,
    mode: 's',
    fetchPlan: '',
    limit: -1,
    class: 'com.orientechnologies.orient.core.sql.OCommandSQL'
  };
  options = options || {};

  if (options.fetchPlan && typeof options.fetchPlan === 'string') {
    data.fetchPlan = options.fetchPlan;
    data.mode = 'a';
  }
  if (+options.limit == options.limit) {
    data.limit = +options.limit;
    data.mode = 'a';
  }
  if (options.mode === 'a') {
    data.mode = options.mode;
  }

  if (data.mode === 'a') {
    data.class = 'com.orientechnologies.orient.core.sql.query.OSQLAsynchQuery';
  }

  if (options.params) {
    if (Array.isArray(options.params)) {
      // arrays get cast to simple objects
      data.params = {
        params: options.params.reduce(function (params, param, i) {
          params[i] = param;
          return params;
        }, {})
      };
    }
    else if (typeof options.params === 'object') {
      data.params = {
        params: options.params
      };
    }
  }

  this.server.logger.debug('executing query against db ' + this.name + ': ' + query);

  return this.send('command', data);
};

/**
 * Execute an SQL query against the database and retreive the results
 *
 * @param   {String} query   The query or command to execute.
 * @param   {Object} options The options for the query / command.
 * @promise {Mixed}          The results of the query / command.
 */
Db.prototype.query = function (command, options) {
  return this.exec(command, options)
  .then(function (response) {
    if (response.results.length === 0)
      return [];
    else if (response.results.length === 1)
      return response.results[0];
    else
      return response.results;
  });
};