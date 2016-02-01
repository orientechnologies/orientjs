"use strict";

var Server = require('../server'),
  ODatabase = require('../db/odatabase'),
  inherits = require("util").inherits,
  errors = require('../errors'),
  EventEmitter = require('events').EventEmitter,
  Promise = require('bluebird');


/**
 * Pool Constructor
 * @param config
 * @constructor
 */

function Pool(config) {
  if (!config) {
    throw new errors.Config('Pool object requires configuration');
  }

  this.configure(config);
}


inherits(Pool, EventEmitter);


module.exports = Pool;

Pool.prototype.configure = function (config) {
  this.server = new Server(config);
  this.config = config;
  this.config.server = this.server;
  this.count = 0;
  this.name = config.name;
  this.min = config.min || 1;
  this.max = config.max || 5;
  this.inUseDBs = [];
  this.availableDBs = [];
  this.waiting = [];
  this.timeout = config.timeout || 30000;
  this.closing = false;
  this.logger = {
    error: config.error || console.error.bind(console),
    log: config.log || console.log.bind(console),
    debug: config.debug || function () {
    } // do not log debug by default
  };

};

/**
 * Request a new db.
 * @returns {Promise} A promise that returns the db if acquired or An arror if rejected
 */
Pool.prototype.acquire = function () {

  if (this.closing) {
    return Promise.reject(new Error("The pool is closing and cannot accept request"));
  }
  return _acquire.bind(this)();

};

function _acquire() {


  var db;
  if (this.availableDBs.length > 0) {
    db = _acquireDB.bind(this)();
    this.logger.debug("Acquired database resource with sessionId: " + db.sessionId);
    return db.open();
  } else if (this.count < this.max) {

    this.logger.debug("Creating and acquiring database resource.");
    createDB.bind(this)();
    db = _acquireDB.bind(this)();
    return db.open();
  } else {
    var deferred = Promise.defer();

    this.logger.debug("Pushing request in waiting queue.");
    var waitingClient = {deferred: deferred};
    waitingClient.timeout = setTimeout(_checkWaiting.bind(this, waitingClient), this.timeout);
    this.waiting.push(waitingClient);
    return deferred.promise;
  }
}

function _acquireDB() {
  var db = this.availableDBs.shift();
  return db;
}
function _releaseDB(db) {
  this.availableDBs.push(db);
}

function _checkWaiting(waitingClient) {


  var idx = this.waiting.indexOf(waitingClient);
  if (idx !== -1) {
    this.waiting.splice(idx, 1);
    waitingClient.deferred.reject(new Error('No db connections available. Timeout ' + this.timeout + " exceeded."));
  }


}
/**
 *
 * @returns {number}
 */
Pool.prototype.getPoolSize = function () {
  return this.count;
};

/**
 *
 * @returns {number|*}
 */
Pool.prototype.getMaxPoolSize = function () {
  return this.max;
};

/**
 *
 * @returns {*|Function|o}
 */
Pool.prototype.getAvailableResources = function () {
  return this.availableDBs.length;
};
/**
 *
 * @param db
 */
Pool.prototype.release = function (db) {

  if (this.waiting.length) {
    var self = this;
    var waiting = this.waiting.shift();
    process.nextTick(function () {
      self.logger.debug("Reusing db with sessionId : ", db.sessionId);
      clearTimeout(waiting.timeout);
      waiting.deferred.resolve(db);
    });
    return;
  } else {
    this.logger.debug("Releasing db with sessionId : ", db.sessionId);
    _releaseDB.bind(this)(db);
    return;
  }
};


Pool.prototype.close = function () {
  this.closing = true;
  this.logger.debug("Closing pool.");
  return new Promise(_drainPool.bind(this));
};

/**
 * Handle the pool draining. Delay until all ops are completed
 * @param resolve
 * @param reject
 * @private
 */
function _drainPool(resolve, reject) {

  if (this.inUseDBs.length > 0) {
    setTimeout(_drainPool.bind(this, resolve, reject), 100);
  } else if (this.count !== this.availableDBs.length) {
    this.logger.debug("Tearing down pool");
    setTimeout(_drainPool.bind(this, resolve, reject), 100);
  } else {
    var promise = [];
    var self = this;
    this.availableDBs.forEach(function (db) {
      self.logger.debug("Closing db with sessionId : ", db.sessionId);
      promise.push(db.close(true));
    });
    Promise.all(promise).then(function (dbs) {
        self.count = 0;
        self.availableDBs = [];
        dbs.forEach(function (db) {
          db.forceClose();
        });
        self.logger.debug("All connections closed.");
        resolve();
      })
      .catch(function () {
        reject();
      });
  }
}
function createDB() {
  this.count += 1;
  this.availableDBs.push(new ODatabase(this.config, this));
}