/*jshint esversion: 6 */
"use strict";
const OCluster = require('./topology').OCluster;
const ODatabase = require('./database').ODatabase;
const ODatabasePool = require('./database').ODatabasePool;
const Errors = require('./errors');
const Promise = require('bluebird');
const EventEmitter = require('events').EventEmitter;

class OrientDBClient extends EventEmitter {

  constructor(config) {
    super();
    this.config = config;
    this.cluster = new OCluster(config);
    this.connecting = null;
    this._configureLogger(config.logger || {});
  }

  connect() {

    if (!this.connecting) {
      if (this.connected) {
        return Promise.resolve(this);
      }
      if (!this.cluster) {
        this.cluster = new OCluster();
      }
      this.connecting = this.cluster.connect()
        .then((cluster) => {
          cluster.on('cluster-config', (config) => {
            this.emit("cluster-config", config);
            // Promise.all(config.map((cfg) => {
            //   let split = cfg.split(":");
            //   let host = split[0];
            //   let port = parseInt(split[1]);
            //   return this.cluster.addServer({host, port});
            // })).then((servers) => {
            //   console.log(servers);
            // })
          });
          this.connecting = null;
          this.connected = true;
          return this;
        }).catch((err) => {
          this.connectionErr = err;
          return Promise.reject(err);
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
   * @returns {Promise<ODatabase>}
   */
  open(config) {
    let db = new ODatabase(this, config);
    return db.open();
  }


  /**
   * Open a pool of sessions with a given config
   * @param {Object} config
   * @returns {Promise<ODatabasePool>}
   */
  openPool(config) {
    let pool = new ODatabasePool(this, config);
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