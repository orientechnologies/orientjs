/*jshint esversion: 6 */
"use strict";

const DB = require('../db/db');
const Statement = require('../db/statement');
const Promise = require('bluebird');
const OResult = require('./result');
const SessionError = require('../errors').SessionError;
const Observable = require('rxjs').Observable;
const SessionTransaction = require('./session-tx');
const Query = require('../../lib/session/session-query');
const ArrayLike = require('../utils').ArrayLike;

class OSession extends DB {

  constructor(client, config, pool) {
    super(config);
    this.client = client;
    this.pool = pool;
    this.augment('class', require('./class'));
    this.server = {
      logger: client.logger
    };
  }


  configure(config) {
    this.sessionId = -1;
    this.forcePrepare = config.forcePrepare != null ? config.forcePrepare : true;
    this.name = config.name;
    this.type = (config.type === 'document' ? 'document' : 'graph');
    this.storage = ((config.storage === 'plocal' || config.storage === 'memory') ? config.storage : 'plocal');
    this.token = null;
    this.useToken = true;
    this.username = config.username || 'admin';
    this.password = config.password || 'admin';
    this.transactionId = 0;
    this.transformers = config.transformers || {};
    this.transformerFunctions = {};
    return this;
  }

  send(op, data) {
    return this.open()
      .bind(this)
      .then(() => {
        data = data || {};
        data.token = data.token || this.token;
        data.sessionId = this.sessionId;
        data.database = this.name;
        data.db = this;
        data.transformerFunctions = this.transformerFunctions;
        this.client.logger.debug('sending operation ' + op + ' for database ' + this.name);
        return this.client.cluster.acquireFrom()
          .then((resource) => {
            let conn = resource.connection;
            let prom = new Promise((resolve, reject) => {
              conn.send(op, data).then((response) => {
                conn.close().then(() => {
                  resolve(response);
                });
              }).catch((err) => {
                conn.close().then(() => {
                  reject(err);
                });
              });
            });
            return prom;
          });
      });
  }


  begin() {

    if (this.currentTx) {
      throw new SessionError("Cannot begin a transaction while a transaction is already opened.");
    } else {
      this.transactionId++;
      this.currentTx = new SessionTransaction(this, this.transactionId);
    }
    return this.currentTx;
  }

  tx() {
    return this.currentTx;
  }

  commit() {

    if (!this.currentTx) {
      throw new SessionError("No active transaction found.");
    }
    return this.currentTx.commit().then((res) => {
      return res;
    });
  }

  exec(query, options) {

    let result = this.execStream(query, options);
    let promise = result.toPromise(Promise);
    return promise;
  }


  execStream(query, options) {

    let result = new OResult((subscriber) => {

      if (this.currentTx) {
        this.currentTx.flush().then((res) => {
          this.internalExec(query, options, result, subscriber);
        }).catch((err) => {
          subscriber.error(err);
        });
      } else {
        this.internalExec(query, options, result, subscriber);
      }
    });
    result.session = this;
    return result;
  }


  query(query, options) {
    return this.execStream(query, options);
  }

  internalExec(query, options, observable, subscriber) {
    if (query instanceof Statement) {
      options = query.buildOptions();
      query = query.toString();
    }
    else if (!options) {
      options = {};
    }

    var data = {
      query: query,
      token: options.token,
      language: options.language,
      pageSize: options.pageSize,
      subscriber: subscriber,
      observable: observable,
    };

    if (options.params) {
      data.params = {params: options.params};
    }


    this.server.logger.debug('executing query against db ' + this.name + ': ' + query);

    if (data.params && data.params.params) {
      this.server.logger.debug(' params: ' + JSON.stringify(data.params.params));
    }

    if (this.listeners('beginQuery').length > 0) {
      this.emit("beginQuery", data);
    }

    var promise = this.send('query', data);

    promise.then((res) => {
      // console.log(res);
    }).catch((err) => {
      data.subscriber.error(err);
    });
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
            input: data
          });
        });
    }
  }

  open() {
    if (this.sessionId != null && this.sessionId !== -1) {
      return Promise.resolve(this);
    }
    this.client.logger.debug('opening database connection to ' + this.name);
    return this.client.cluster.acquireFrom()
      .then((resource) => {
        this.srv = resource.server;
        let connection = resource.connection;
        return connection.send('db-open', {
          name: this.name,
          type: this.type,
          username: this.username,
          password: this.password,
          useToken: this.useToken
        }).bind(this).then((response) => {
          this.client.logger.debug('Got session id ' + response.sessionId + ' for database ' + this.name);
          this.sessionId = response.sessionId;
          this.cluster.cacheData(response.clusters);
          this.serverCluster = response.serverCluster;
          this.release = response.release;
          this.token = response.token;
          // if (response.serverCluster && this.server.transport.connection) {
          // this.server.transport.connection.emit('update-config', response.serverCluster);
          // }
          // this.server.once('error', function () {
          //   this.sessionId = null;
          // }.bind(this));
          return connection.close();
        }).bind(this)
          .then(() => {
            return this;
          });
      });
  }

  liveQuery(command, options) {


    let result = Observable.create((subscriber) => {
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
            var wrapperCallback = function (currentToken, operation, result) {
              if (currentToken == iToken) {
                subscriber.next({token: currentToken, operation: operation, data: result});
              }
            };

            var unsubscribeCallbak = function (currentToken) {
              if (currentToken == iToken) {
                subscriber.complete();
              }
            };

            this.srv.on("live-query-result", wrapperCallback);

            this.srv.on("live-query-end", unsubscribeCallbak);

          }
        }).catch((error) => {
        subscriber.error(error);
      });
    });

    return result;
  }

  close() {
    if (this.pool) {
      return this.pool.release(this);
    } else {
      return this._forceClose();
    }
  }


  createQuery() {
    return new Query(this);
  }

  _forceClose() {
    return this.client.cluster.acquireFrom()
      .then((resource) => {
        let conn = resource.connection;
        return conn.send('db-close', {
          sessionId: this.sessionId,
          token: this.token
        }).bind(this)
          .then(function () {
            this.sessionId = -1;
            return conn.close();
          })
          .bind(this)
          .then(() => {
            return this;
          });
      });
  }
}


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

module.exports = OSession;