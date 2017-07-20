/*jshint esversion: 6 */
"use strict";

const DB = require('../db/db');
const Statement = require('../db/statement');
const Promise = require('bluebird');
const OResult = require('./result');
const DatabaseError = require('../errors').DatabaseError;
const Observable = require('rxjs').Observable;
const Subject = require('rxjs').Subject;
const ODatabaseTransaction = require('./database-tx');
const Query = require('./database-query');
const SessionManager = require('./session');

class ODatabase extends DB {

  constructor(client, config, pool) {
    super(config);
    this.client = client;
    this.pool = pool;
    this.augment('class', require('./class'));
    this.augment('record', require('./record'));
    this.server = {
      logger: client.logger
    };
    this.sessionManager = new SessionManager(this.client, config);
  }


  configure(config) {
    this.sessionId = undefined;
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
    return this.sessionManager.send(this, op, data);
  }


  begin() {
    if (this.currentTx) {
      throw new DatabaseError("Cannot begin a transaction while a transaction is already opened.");
    } else {
      this.transactionId++;
      this.currentTx = new ODatabaseTransaction(this, this.transactionId);
    }
    return this.currentTx;
  }

  tx() {
    return this.currentTx;
  }

  commit() {

    if (!this.currentTx) {
      throw new DatabaseError("No active transaction found.");
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

    let result = Observable.create((subscriber) => {

      if (this.currentTx) {
        this.currentTx.flush().then((res) => {
          this.internalExec(query, options, result, subscriber);
        }).catch((err) => {
          subscriber.error(err);
        });
      } else {
        this.internalExec(query, options, result, subscriber);
      }
    }).publish().refCount();

    result.all = () => {
      return new Promise((resolve, reject) => {
        let results = [];
        result.subscribe((record) => {
            results.push(record);
          },
          (err) => {
            reject(err);
          }, () => {
            resolve(results);
          });
      });
    };
    result.db = this;
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


    this.client.logger.debug('executing query against db ' + this.name + ': ' + query);

    if (data.params && data.params.params) {
      this.client.logger.debug(' params: ' + JSON.stringify(data.params.params));
    }

    if (this.listeners('beginQuery').length > 0) {
      this.emit("beginQuery", data);
    }

    let promise = this.send('query', data);

    promise.then((res) => {

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
    return this.sessionManager.open()
      .then(() => {
        return this;
      });
  }


  session() {
    return this.sessionManager.current();
  }

  liveQuery(query, options) {

    let result = Observable.create((subscriber) => {

      options = options || {};
      options.query = query;

      result.subscribing = this.sessionManager.sendOnSubscribe(this, "subscribe-live-query", options, (resource) => {
        result.resource = resource;
      });
      result.subscribing.then((response) => {
        let thisMonitorId = response.monitorId;
        result.monitorId = thisMonitorId;
        this.client.logger.debug(`Live query  '${query}' subscribed with monitor id : ${thisMonitorId}`);

        result.resource.connection.on("live-query-result", (token, op, result) => {

          let monitorId = result.monitorId;
          if (thisMonitorId === monitorId) {
            this.client.logger.debug(`Live query results for '${query}' with monitor id : ${monitorId}`);
            result.events.forEach((e) => {
              let msg = {monitorId: monitorId, operation: e.type, data: e.data};
              if (e.type == 2) {
                msg.before = e.before;
              }
              subscriber.next(msg);
            });
          }
        });
        result.resource.connection.on("live-query-end", (monitorId) => {
          if (thisMonitorId === monitorId) {
            this.client.logger.debug(`Live query '${query}' with monitor id : ${thisMonitorId} completed`);
            subscriber.complete();
          }
        });
      }).catch((err) => {
        result.subscribing = null;
        subscriber.error(err);
      });
    }).publish().refCount();


    let checkSubscribing = () => {
      return result.subscribing ? result.subscribing : Promise.resolve();
    };
    result.unSubscribe = () => {
      checkSubscribing().then(() => {
        let data = {
          monitorId: result.monitorId
        };
        this.sessionManager.sendOnSubscribe(this, "unsubscribe-live-query", data)
          .then(() => {
            this.client.logger.debug(`Unsubscribe sent to live query '${query}' with monitor id : ${result.monitorId}`);
          }).catch((err) => {
          throw  err;
        });
      });
    };
    return result;
  }

  close() {
    if (this.pool) {
      return this.pool.release(this);
    } else {
      return this._forceClose();
    }
  }

  reload() {
    this.client.logger.debug('Reloading database information');
    return this.send('db-reload')
      .bind(this)
      .then(function (response) {
        this.cluster.cacheData(response.clusters);
        return this;
      });
  }

  createQuery() {
    return new Query(this);
  }

  _forceClose() {
    return this.sessionManager.close()
      .then(() => {
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
  }
  else {
    list.push(item);
  }
  return list;
}

module.exports = ODatabase;