/*jshint esversion: 6 */
"use strict";

const DB = require("../../db/db");
const Statement = require("../../db/statement");
const Promise = require("bluebird");
const DatabaseError = require("../../errors").DatabaseError;
const RequestError = require("../../errors").RequestError;
const ODatabaseTransaction = require("./database-tx");
const Result = require("./result");
const LiveQuery = require("./live-query");
const Query = require("./database-query");
const SessionManager = require("./session");
const OperationType = require("./constants").OPERATION_TYPES;

class ODatabase extends DB {
  constructor(client, config, pool) {
    super(config);
    this.client = client;
    this.pool = pool;
    this.augment("class", require("./class"));
    this.augment("record", require("./record"));
    this.server = {
      logger: client.logger
    };
    this.sessionManager = new SessionManager(this.client, config);
  }

  configure(config) {
    this.sessionId = undefined;
    this.forcePrepare =
      config.forcePrepare != null ? config.forcePrepare : true;
    this.name = config.name;
    this.type = config.type === "document" ? "document" : "graph";
    this.storage =
      config.storage === "plocal" || config.storage === "memory" ? config.storage : "plocal";
    this.token = null;
    this.useToken = true;
    this.username = config.username || "admin";
    this.password = config.password || "admin";
    this.transactionId = 0;
    this.transformers = config.transformers || {};
    this.transformerFunctions = {};
    return this;
  }

  send(op, data) {
    return this.sessionManager.send(this, op, data);
  }

  /**
   * Begin a transaction
   * @returns {ODatabaseTransaction} The new transaction
   */
  begin() {
    if (this.currentTx) {
      throw new DatabaseError(
        "Cannot begin a transaction while a transaction is already opened."
      );
    } else {
      this.transactionId++;
      this.currentTx = new ODatabaseTransaction(this, this.transactionId);
    }
    return this.currentTx;
  }

  /**
   * Get the current transaction
   * @returns {ODatabaseTransaction} The new transaction
   */
  tx() {
    return this.currentTx;
  }

  /**
   * Commit the transaction.
   *
   * @return {Promise} The results of the transaction.
   */
  commit() {
    if (!this.currentTx) {
      throw new DatabaseError("No active transaction found.");
    }
    return this.currentTx.commit().then(res => {
      return res;
    });
  }

  exec(query, options) {
    let result = this.execStream(query, options);
    let promise = result.toPromise(Promise);
    return promise;
  }

  execStream(query, options) {
    let stream = new Result(this);
    if (this.currentTx) {
      this.currentTx
        ._flush()
        .then(res => {
          this._internalExec(query, options, stream);
        })
        .catch(err => {
          stream.emit("error", err);
        });
    } else {
      this._internalExec(query, options, stream);
    }
    return stream;
  }

  /**
   * Execute an SQL query against the database and retreive the results
   * @param   {String} query    The query to execute.
   * @param   {Object} options  The options for the query
   * @return {OResult}          The results of the query
   */
  query(query, options) {
    options = options || {};
    options.idempotent = true;
    options.operationType = OperationType.QUERY;
    return this.execStream(query, options);
  }

  /**
   * Execute an SQL command against the database and retreive the results
   * @param   {String} command    The command to execute.
   * @param   {Object} options    The options for the command
   * @return  {OResult}           The results of the command
   */
  command(command, options) {
    options = options || {};
    options.idempotent = false;
    options.operationType = OperationType.COMMAND;
    return this.execStream(command, options);
  }

  /**
   * Execute an SQL batch script against the database and retreive the results
   * @param   {String} batch     The SQL batch to execute.
   * @param   {Object} options   The options for the batch script
   * @return  {OResult}          The results of the batch script
   */
  batch(batch, options) {
    return this.execute("sql", batch, options);
  }

  /**
   * Execute an Custom language script against the database and retreive the results
   *
   * @param   {String} language    The scripting language
   * @param   {String} script      The script to execute.
   * @param   {Object} options     The options for the script
   * @return  {OResult}            The results of the script
   */
  execute(language, script, options) {
    options = options || {};
    options.idempotent = false;
    options.language = language;
    options.operationType = OperationType.EXECUTE;
    return this.execStream(script, options);
  }

  retry(retryWork, times) {
    times = times || 10;
    return new Promise((resolve, reject) => {
      this._retry(retryWork, times, resolve, reject);
    });
  }

  _retry(retryWork, times, resolve, reject, error) {
    if (times === 0) {
      reject(error);
    }
    const promise = Promise.resolve(retryWork(this));
    promise
      .then(result => {
        resolve(result);
      })
      .catch(error => {
        if (error instanceof RequestError && error.isMVCC()) {
          this._retry(retryWork, times--, resolve, reject, error);
        } else {
          reject(error);
        }
      });
  }
  runInTransaction(txWork, times) {
    return this.retry(db => {
      return new Promise((resolve, reject) => {
        try {
          db.begin();
          const promise = Promise.resolve(txWork(db.tx()));
          promise
            .then(result => {
              if (db.tx()) {
                return Promise.all([Promise.resolve(result), db.tx().commit()]);
              } else {
                return Promise.all([
                  Promise.resolve(result),
                  Promise.resolve(null)
                ]);
              }
            })
            .then(result => {
              resolve({ result: result[0], tx: result[1] });
            })
            .catch(err => {
              db.currentTx = null;
              reject(err);
            });
        } catch (e) {
          if (db.tx()) {
            db.tx().rollback();
          }
          reject(e);
        }
      });
    }, times);
  }
  _internalExec(query, options, stream) {
    if (query instanceof Statement) {
      options = query.buildOptions();
      query = query.toString();
    } else if (!options) {
      options = {};
    }

    let data = {
      query: query,
      token: options.token,
      language: options.language,
      pageSize: options.pageSize,
      stream: stream,
      idempotent: options.idempotent,
      operationType: options.operationType
    };

    if (options.params) {
      data.params = { params: options.params };
    }

    this.client.logger.debug(
      "executing query against db " + this.name + ": " + query
    );

    if (data.params && data.params.params) {
      this.client.logger.debug(
        " params: " + JSON.stringify(data.params.params)
      );
    }

    if (this.listeners("beginQuery").length > 0) {
      this.emit("beginQuery", data);
    }

    let promise = this.send("query", data);

    promise.then(res => {}).catch(err => {
      data.stream.emit("error", err);
    });
    if (this.listeners("endQuery").length > 0) {
      var err,
        e,
        s = Date.now();
      promise
        .bind(this)
        .catch(function(_err) {
          err = _err;
        })
        .tap(function(res) {
          e = Date.now();
          this.emit("endQuery", {
            err: err,
            result: res,
            perf: {
              query: e - s
            },
            input: data
          });
        });
    }
  }

  open() {
    return this.sessionManager.open().then(() => {
      return this;
    });
  }

  session() {
    return this.sessionManager.current();
  }

  /**
   * Execute an SQL Live query against the database and retreive the results
   *
   * @param   {String} query    The query to execute.
   * @param   {Object} options  The options for the batch script
   * @return  {LiveQuery}       The live query object
   */
  liveQuery(query, options) {
    options = options || {};
    options.query = query;
    let live = new LiveQuery(this, options);
    return live;
  }

  /**
   * Close this database
   * @return
   */
  close() {
    if (this.pool) {
      return this.pool.release(this);
    } else {
      return this._forceClose();
    }
  }

  reload() {
    this.client.logger.debug("Reloading database information");
    return this.send("db-reload")
      .bind(this)
      .then(function(response) {
        this.cluster.cacheData(response.clusters);
        return this;
      });
  }

  createQuery() {
    return new Query(this);
  }

  _forceClose() {
    return this.sessionManager.close().then(() => {
      return this;
    });
  }
}

/**
 * Flatten an array of arrays
 */
function flatten(list, item) {
  if (Array.isArray(item)) {
    return item.reduce(flatten, list);
  } else {
    list.push(item);
  }
  return list;
}

module.exports = ODatabase;
