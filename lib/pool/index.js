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
  this.min = config.min | 1;
  this.max = config.max | 5;
  this.availableDBs = [];
  this.waiting = [];
  this.closing = false;
};

/**
 *
 * @returns {*}
 */
Pool.prototype.acquire = function () {

  return _acquire.bind(this)();

};

function _acquire() {

  var self = this;
  return new Promise(function (resolve, reject) {
    if (self.availableDBs.length > 0) {
      self.availableDBs.shift().open().then(resolve).catch(reject);
    } else if (self.count < self.max) {
      createDB.bind(self)();
      self.availableDBs.shift().open().then(resolve).catch(reject);
    } else {
      self.waiting.push({deferred: {resolve: resolve, reject: reject}});
    }
  });
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
    var waiting = this.waiting.shift();
    waiting.deferred.resolve(db);
    return;
  } else {
    this.availableDBs.push(db);
    return;
  }
};


Pool.prototype.close = function () {


  var self = this;
  var promise = [];
  this.availableDBs.forEach(function (db) {
    promise.push(db.close(true));
  });
  return new Promise(function (resolve, reject) {
    Promise.all(promise).then(function (dbs) {
        self.count = 0;
        self.availableDBs = [];
        dbs.forEach(function (db) {
          db.forceClose();
        });
        resolve();
      })
      .catch(function () {
        reject();
      });
  });
};

function createDB() {
  this.count += 1;
  this.availableDBs.push(new ODatabase(this.config, this));
}