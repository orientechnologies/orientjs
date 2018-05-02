/*jshint esversion: 6 */
"use strict";

const BasePool = require('../pool').BasePool;
const ODatabase = require('./database');
const Promise = require('bluebird');
const errors = require('../../errors');

class ODatabasePool extends BasePool {

  constructor(client, config) {
    super(config, {client: client});
    this.client = client;
  }


  createError(err) {

    return new errors.DatabaseError("Error creating a database resource from pool");
  }

  createPool(config, params) {
    return new ODatabasePoolFactory(config, this, params);
  }
}


class ODatabasePoolFactory {

  constructor(config, pool, params) {
    this.config = config;
    this.pool = pool;
    this.client = params.client;
  }

  create() {

    return new Promise((resolve, reject) => {
      let db = new ODatabase(this.client, this.config, this.pool);
      db.open().then(resolve).catch(reject);
    });
  }

  destroy(db) {
    return new Promise((resolve, reject) => {
      db._forceClose().then(resolve).catch(reject);
    });
  }
}
module.exports = ODatabasePool;