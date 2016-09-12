"use strict";

var utils = require('../utils'),
  errors = require('../errors'),
  Promise = require('bluebird'),
  RID = require('../recordid'),
  Statement = require('./statement'),
  RawExpression = Statement.RawExpression,
  Query = require('./query'),
  Transaction = require('./transaction'),
  ArrayLike = utils.ArrayLike,
  inherits = require("util").inherits,
  EventEmitter = require('events').EventEmitter,
  fast = require('fast.js'),
  parseFn = require("parse-function");


/**
 * Database Constructor.
 *
 * @param {Object} config The optional configuration for the database.
 */
function Db(config) {
  if (!config) {
    throw new errors.Config('Database object requires configuration');
  }
  this.configure(config);
  this.init();
  this.augment('cluster', require('./cluster'));
  this.augment('class', require('./class'));
  this.augment('record', require('./record'));
  utils.deprecate(this, 'vertex', 'db.vertex.* is deprecated, use the query builder instead!', function () {
    this.augment('vertex', require('./vertex'));
  });
  utils.deprecate(this, 'edge', 'db.edge.* is deprecated, use the query builder instead!', function () {
    this.augment('edge', require('./edge'));
  });
  this.augment('index', require('./index/index'));
}

inherits(Db, EventEmitter);


Db.prototype.augment = utils.augment;
Db.extend = utils.extend;

Db.Statement = Statement;
Db.Query = Query;

module.exports = Db;

/**
 * Configure the database instance.
 * @param  {Object} config The configuration for the database.
 * @return {Db}            The configured database object.
 */
Db.prototype.configure = function (config) {
  this.sessionId = config.sessionId != null ? config.sessionId : -1;
  this.forcePrepare = config.forcePrepare != null ? config.forcePrepare : true;
  this.name = config.name;

  this.server = config.server;
  this.server.on('reset', function () {
    this.sessionId = null;
  }.bind(this));

  this.type = (config.type === 'document' ? 'document' : 'graph');

  this.storage = ((config.storage === 'plocal' || config.storage === 'memory') ? config.storage : 'plocal');
  this.token = null;
  this.useToken = config.useToken != null ? config.useToken : this.server.useToken;
  this.username = config.username || 'admin';
  this.password = config.password || 'admin';
  this.dataSegments = [];
  this.transactionId = 0;
  this.transformers = config.transformers || {};
  this.transformerFunctions = {};
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


  if (this.sessionId != null && this.sessionId !== -1) {
    return Promise.resolve(this);
  }

  this.server.logger.debug('opening database connection to ' + this.name);
  return this.server.send('db-open', {
      name: this.name,
      type: this.type,
      username: this.username,
      password: this.password,
      useToken: this.useToken
    })
    .bind(this)
    .then(function (response) {
      this.server.logger.debug('got session id ' + response.sessionId + ' for database ' + this.name);
      this.sessionId = response.sessionId;
      this.cluster.cacheData(response.clusters);
      this.serverCluster = response.serverCluster;
      this.release = response.release;
      this.token = response.token;
      if (response.serverCluster && this.server.transport.connection) {
        this.server.transport.connection.emit('update-config', response.serverCluster);
      }
      this.server.once('error', function () {
        this.sessionId = null;
      }.bind(this));
      return this;
    });
};

/**
 * Close the database.
 *
 * @promise {Db} The now closed db instance.
 */
Db.prototype.close = function () {
  return this.server.send('db-close', {
      sessionId: this.sessionId
    })
    .bind(this)
    .then(function () {
      this.sessionId = null;
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
      data = data || {};
      data.token = data.token || this.token;
      data.sessionId = this.sessionId;
      data.database = this.name;
      data.db = this;
      data.transformerFunctions = this.transformerFunctions;
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
  if (this.sessionId === -1) {
    return this.open();
  }
  this.server.logger.debug('Reloading database information');
  return this.send('db-reload')
    .bind(this)
    .then(function (response) {
      this.cluster.cacheData(response.clusters);
      return this;
    });
};

/**
 * Begin a new transaction.
 *
 * @return {Transaction} The transaction instance.
 */
Db.prototype.begin = function () {
  this.transactionId++;
  return new Transaction(this, this.transactionId);
};


/**
 * Execute an SQL query against the database and retreive the raw, parsed response.
 *
 * @param   {String} query   The query or command to execute.
 * @param   {Object} options The options for the query / command.
 * @promise {Mixed}          The results of the query / command.
 */
Db.prototype.exec = function (query, options) {
  if (query instanceof Statement) {
    options = query.buildOptions();
    query = query.toString();
  }
  else if (!options) {
    options = {};
  }
  var data = {
    query: query,
    mode: options.mode || 's',
    fetchPlan: '',
    limit: -1,
    token: options.token,
    language: options.language,
    class: options.class || 'com.orientechnologies.orient.core.sql.OCommandSQL'
  };

  if (options.fetchPlan && typeof options.fetchPlan === 'string') {
    data.fetchPlan = options.fetchPlan;
    data.mode = 'a';
  }
  if (+options.limit == options.limit) {
    data.limit = +options.limit;
    data.mode = options.mode || 'a';
  }

  if (data.mode === 'a' && !options.class) {
    data.class = 'com.orientechnologies.orient.core.sql.query.OSQLAsynchQuery';
  }

  if (options.params) {
    if (Array.isArray(options.params)) {
      // arrays get cast to simple objects
      data.params = {
        params: options.params.reduce(function (params, param, i) {
          params[i] = param;
          return params;
        }, new ArrayLike())
      };
    }
    else if (typeof options.params === 'object') {
      data.params = {
        params: options.params
      };
    }
  }

  this.server.logger.debug('executing query against db ' + this.name + ': ' + query);

  if (data.params && data.params.params) {
    this.server.logger.debug(' params: ' +  JSON.stringify(data.params.params));
  }

  

  if (this.listeners('beginQuery').length > 0) {
    this.emit("beginQuery", data);
  }

  var promise = this.send('command', data);

  if (this.listeners('endQuery').length > 0) {
    var err, e, s = Date.now();
    promise
      .bind(this)
      .catch(function (_err) {
        err = _err;
      })
      .tap(function (res) {
        e = Date.now();
        this.emit("endQuery", {
          err: err,
          result: res,
          perf: {
            query: e - s
          },
          input : data
        });
      });
  }

  return promise;
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
    .bind(this)
    .then(function (response) {
      if (!response.results || response.results.length === 0) {
        return [[], []];
      }

      // specific case of batch return
      if (response.results[0].type === 'f') {

        return response.results.map(this.normalizeResult, this).reduce(function (list, item, index) {
          if (index === 0) {
            if (Array.isArray(item)) {
              list[0] = item;
            } else {
              list[0] = [item];
            }
          } else {
            if (item && item['@preloaded']) {
              delete item['@preloaded'];
              list[1].push(item);
            }
          }
          return list;
        }, [[], []]);

      }
      return response.results
        .map(this.normalizeResult, this)
        .reduce(flatten, [])
        .reduce(function (list, item) {
          if (item && item['@preloaded']) {
            delete item['@preloaded'];
            list[1].push(item);
          }
          else {
            list[0].push(item);
          }
          return list;
        }, [[], []]);
    })
    .spread(function (results, preloaded) {
      results = this.record.resolveReferences(results, preloaded);
      return results;
    });
};

/**
 * Execute a live query against the database
 *
 * @param   {String} query   The query or command to execute.
 * @param   {Object} options The options for the query / command.
 * @promise {Mixed}          The token of the live query.
 */
Db.prototype.liveQuery = function (command, options) {
  options = options || {};
  options.mode = 'l';
  options.class = 'q';
  this.exec(command, options)
    .bind(this)
    .then(function (response) {
      if (!response.results || response.results.length === 0) {
        return [[], []];
      }
      return response.results
        .map(this.normalizeResult, this)
        .reduce(flatten, [])
        .reduce(function (list, item) {
          if (item && item['@preloaded']) {
            delete item['@preloaded'];
            list[1].push(item);
          }
          else {
            list[0].push(item);
          }
          return list;
        }, [[], []]);
    })
    .spread(function (results, preloaded) {
      results = this.record.resolveReferences(results, preloaded);
      return results;
    })
    .then(function (response) {
      if (response.length > 0) {
        var iToken = response[0].token;
        var parentDb = this;
        var wrapperCallback = function (currentToken, operation, result) {
          if (currentToken == iToken) {
            if (operation === 1) {
              parentDb.emit("live-update", result);
            } else if (operation === 2) {
              parentDb.emit("live-delete", result);
            } else if (operation === 3) {
              parentDb.emit("live-insert", result);
              parentDb.emit("live-create", result);
            }
          }
        };
        this.server.transport.connection.on("live-query-result", wrapperCallback);

      }
    });
  return this;
};


/**
 * Normalize a result, where possible.
 * @param  {Object} result The result to normalize.
 * @return {Object}        The normalized result.
 */
Db.prototype.normalizeResult = function (result) {
  var value;
  if (!result) {
    return result;
  }
  if (Array.isArray(result)) {
    return result.map(this.normalizeResult, this);
  }
  if (result.type === 'r') {
    return this.normalizeResultContent(result.content, this);
  } else if (result.type === 'f') {
    return result.content;
  } else if (result.type === 'p') {
    value = this.normalizeResultContent(result.content, this);
    value['@preloaded'] = true;
    return value;
  }
  else if (result.type === 'l') {
    return result.content.map(this.normalizeResultContent, this);
  }
  else {
    return result;
  }
};

/**
 * Normalize the content for a result.
 * @param  {Mixed} content The content to normalize.
 * @return {Mixed}         The normalized content.
 */
Db.prototype.normalizeResultContent = function (content) {
  var value;
  if (!content) {
    return null;
  }
  else if (Array.isArray(content)) {
    return content.map(this.normalizeResultContent, this);
  }

  if (content.type === 'd') {
    value = content.value || {};
    value['@rid'] = new RID({
      cluster: content.cluster,
      position: content.position
    });
    value['@version'] = content.version;
    return value;
  }
  else {
    return content;
  }
};

/**
 * Register a transformer function for documents of the given class.
 * This function will be invoked for each document of the specified class
 * in all future result sets.
 *
 * @param  {String}   className   The name of the document class.
 * @param  {Function} transformer The transformer function.
 * @return {Db}                   The database instance.
 */
Db.prototype.registerTransformer = function (className, transformer) {
  if (!this.transformers[className]) {
    this.transformers[className] = [];
    this.transformerFunctions[className] = fast.bind(this.transformDocument, this);
  }
  this.transformers[className].push(transformer);
  return this;
};


/**
 * Transform a document according to its `@class` property, using the registered transformers.
 * @param  {Object} document The document to transform.
 * @return {Mixed}           The transformed document.
 */
Db.prototype.transformDocument = function (document) {
  var className = document['@class'];
  if (this.transformers[className]) {
    return this.transformers[className].reduce(function (document, transformer) {
      return transformer(document);
    }, document);
  }
  else {
    return document;
  }
};


/**
 * Create a raw expression.
 *
 * @return {RawExpression} The raw expression instance.
 */
Db.prototype.rawExpression = function (value) {
  return new RawExpression(value, this);
};


// # Query Builder Methods

/**
 * Create a query instance for this database.
 *
 * @return {Query} The query instance.
 */
Db.prototype.createQuery = function () {
  return new Query(this);
};

/**
 * Create a create query.
 *
 * @return {Query} The query instance.
 */
Db.prototype.create = function () {
  var query = this.createQuery();
  return query.create.apply(query, arguments);
};

/**
 * Create a select query.
 *
 * @return {Query} The query instance.
 */
Db.prototype.select = function () {
  var query = this.createQuery();
  return query.select.apply(query, arguments);
};

/**
 * Create a traverse query.
 *
 * @return {Query} The query instance.
 */
Db.prototype.traverse = function () {
  var query = this.createQuery();
  return query.traverse.apply(query, arguments);
};


/**
 * Create an insert query.
 *
 * @return {Query} The query instance.
 */
Db.prototype.insert = function () {
  var query = this.createQuery();
  return query.insert.apply(query, arguments);
};


/**
 * Create an update query.
 *
 * @return {Query} The query instance.
 */
Db.prototype.update = function () {
  var query = this.createQuery();
  return query.update.apply(query, arguments);
};

/**
 * Create a delete query.
 *
 * @return {Query} The query instance.
 */
Db.prototype.delete = function () {
  var query = this.createQuery();
  return query.delete.apply(query, arguments);
};


/**
 * Create a transactional query.
 *
 * @return {Query} The query instance.
 */
Db.prototype.let = function () {
  var query = this.createQuery();
  return query.let.apply(query, arguments);
};

/**
 * Escape the given input.
 *
 * @param  {String} input The input to escape.
 * @return {String}       The escaped input.
 */
Db.prototype.escape = utils.escape;


/**
 * Create a context for a user, using their authentication token.
 * The context includes the query builder methods, which will be executed
 * on behalf of the user.
 *
 * @param  {Buffer|String} token The authentication token.
 * @return {Object}              The object containing the query builder methods.
 */
Db.prototype.createUserContext = function (token) {
  var db = this;
  return {
    /**
     * Create a query instance for this database.
     *
     * @return {Query} The query instance.
     */
    createQuery: function () {
      return db.createQuery().token(token);
    },
    create: function () {
      return db.create.apply(db, arguments).token(token);
    },
    select: function () {
      return db.select.apply(db, arguments).token(token);
    },
    traverse: function () {
      return db.traverse.apply(db, arguments).token(token);
    },
    insert: function () {
      return db.insert.apply(db, arguments).token(token);
    },
    update: function () {
      return db.update.apply(db, arguments).token(token);
    },
    delete: function () {
      return db.delete.apply(db, arguments).token(token);
    },
    let: function () {
      return db.let.apply(db, arguments).token(token);
    },
    escape: utils.escape
  };
};

/**
 * Create a orient function from a plain Javascript function
 *
 * @param   {String} name     The name of the function
 * @param   {Object} fn       Plain Javascript function to stringify
 * @param   {Object} options  Not currently used but will be used for 'IDEMPOTENT' arg
 * @promise {Mixed}           The results of the query / command.
 */
Db.prototype.createFn = function (name, fn, options) {
  if (typeof(name) === "function") {
    options = fn;
    fn = name;
    name = fn.name;
  }

  var fnDef = parseFn(fn);
  var params = "";
  var body = fnDef.body
    .replace(/\'/g, "\\'")
    .replace(/\"/g, '\\"')
    .trim();

  // NOTE: We can't do `PARAMETERS []` because else orientdb throws an error
  if (fnDef.arguments.length > 0) {
    params = 'PARAMETERS [' + fnDef.params + ']';
  }

  return this.query('CREATE FUNCTION ' + name + ' "' + body + '" ' + params + ' LANGUAGE Javascript');
};

/**
 * Flatten an array of arrays
 */
function flatten(list, item) {
  if (Array.isArray(item)) {
    return item.reduce(flatten, list);
  }
  else {
    list.push(item);
  }
  return list;
}
