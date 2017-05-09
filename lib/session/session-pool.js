/*jshint esversion: 6 */
"use strict";

let BasePool = require('../pool').BasePool;
let OSession = require('./session');
let Promise = require('bluebird');
let errors = require('../errors');

class OSessionPool extends BasePool {

  constructor(client, config) {
    super(config, {client: client});
    this.client = client;
  }


  createError(err) {
    return new errors.SessionError("Error creating a session resource from pool");
  }

  createPool(config, params) {
    return new SessionPoolFactory(config, this, params);
  }
}


class SessionPoolFactory {

  constructor(config, pool, params) {
    this.config = config;
    this.pool = pool;
    this.client = params.client;
  }

  create() {

    return new Promise((resolve, reject) => {
      let session = new OSession(this.client, this.config, this.pool);
      session.open().then(resolve).catch(reject);
    });
  }

  destroy(session) {
    return new Promise((resolve, reject) => {
      session._forceClose().then(resolve).catch(reject);
    });
  }
}
module.exports = OSessionPool;