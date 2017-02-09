/*jshint esversion: 6 */
"use strict";
let OCluster = require('./topology').OCluster;
let OSession = require('./session').OSession;
let OSessionPool = require('./session').OSessionPool;
let Errors = require('./errors');
let Promise = require('bluebird');

class OrientDBClient {

  constructor(config) {
    this.config = config;
    this.cluster = new OCluster(config);
    this.connecting = null;
    this._configureLogger(config.logger || {});
  }

  connect() {

    if (!this.connecting) {
      if (!this.cluster) {
        this.cluster = new OCluster();
      }
      this.connecting = this.cluster.connect()
        .then(() => {
          this.connecting = null;
          return this;
        });
    }
    return this.connecting;
  }

  _configureLogger(config) {
    this.logger = {
      error: config.error || console.error.bind(console),
      log: config.log || console.log.bind(console),
      debug: config.debug || function () {
      } // do not log debug by default
    };
    return this;
  }

  /**
   * Open a session with a given config
   * @param {Object} config
   * @returns {Promise<OSession>}
   */
  open(config) {
    let session = new OSession(this, config);
    return session.open();
  }


  /**
   * Open a pool of sessions with a given config
   * @param {Object} config
   * @returns {Promise<OSessionPool>}
   */
  openPool(config) {
    let pool = new OSessionPool(this, config);
    return new Promise((resolve) => {
      resolve(pool);
    });
  }

  /**
   * Create a database with a given config
   * @param {String} username  Server user
   * @param {String}password  Server password
   * @param {String|Object} config The database name, or configuration object.
   * @returns {Promise}
   */
  create(username, password, config) {
    config = config || '';

    if (typeof config === 'string' || typeof config === 'number') {
      config = {
        name: '' + config,
        type: 'graph',
        storage: 'plocal'
      };
    }
    else {
      config = {
        name: config.name,
        type: (config.type || config.type),
        storage: config.storage || config.storage || 'plocal'
      };
    }

    if (!config.name) {
      return Promise.reject(new Errors.Config('Cannot create database, no name specified.'));
    }

    if (config.type !== 'document' && config.type !== 'graph') {
      config.type = 'graph';
    }

    if (config.storage !== 'local' && config.storage !== 'plocal' && config.storage !== 'memory') {
      config.storage = 'plocal';
    }
    this.logger.debug('Creating database ' + config.name);

    let ctx = {};
    return this.cluster.acquireFrom()
      .then((resource) => {
        ctx.conn = resource.connection;
        return ctx.conn.send('connect', {
          username: username,
          password: password,
          useToken: true
        });
      })
      .then((response) => {
        ctx.sessionId = response.sessionId;
        ctx.token = response.token;
        return ctx.conn.send('db-create', Object.assign({}, config, {
          sessionId: ctx.sessionId,
          token: ctx.token
        }));
      })
      .then(() => {
        return ctx.conn.send('db-close', {
          sessionId: ctx.sessionId,
          token: ctx.token
        });
      })
      .then(() => {
        return ctx.conn.close();
      });

  }

  /**
   * Drop a database with a given config
   * @param {String} username  Server user
   * @param {String}password  Server password
   * @param {String|Object} config, The database name, or configuration object.
   * @returns {Promise}
   */
  drop(username, password, config) {
    let ctx = {};
    return this.cluster.acquireFrom()
      .then((resource) => {
        ctx.conn = resource.connection;
        return ctx.conn.send('connect', {
          username: username,
          password: password,
          useToken: true
        });
      })
      .then((response) => {
        ctx.sessionId = response.sessionId;
        ctx.token = response.token;
        return ctx.conn.send('db-delete', Object.assign({}, config, {
          sessionId: ctx.sessionId,
          token: ctx.token
        }));
      })
      .then(() => {
        return ctx.conn.send('db-close', {
          sessionId: ctx.sessionId,
          token: ctx.token
        });
      }).then(() => {
        return ctx.conn.close();
      });
  }

  /**
   * Determine whether a database exists with the given config.
   * @param {String} username  Server user
   * @param {String}password  Server password
   * @param {String|Object} config, The database name, or configuration object.
   * @returns {Promise}
   */
  exists(username, password, config) {
    let ctx = {};
    return this.cluster.acquireFrom()
      .then((resource) => {
        ctx.conn = resource.connection;
        return ctx.conn.send('connect', {
          username: username,
          password: password,
          useToken: true
        });
      })
      .then((response) => {
        ctx.sessionId = response.sessionId;
        ctx.token = response.token;
        return ctx.conn.send('db-exists', Object.assign({}, config, {
          sessionId: ctx.sessionId,
          token: ctx.token
        }));
      })
      .then((response) => {
        ctx.exists = response.exists;
        return ctx.conn.send('db-close', {
          sessionId: ctx.sessionId,
          token: ctx.token
        });
      })
      .then(() => {
        return ctx.conn.close();
      })
      .then(() => {
        return ctx.exists;
      });
  }
}

module.exports = OrientDBClient;