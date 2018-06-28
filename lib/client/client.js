/*jshint esversion: 6 */
"use strict";
const OCluster = require("./topology").OCluster;
const ODatabaseSession = require("./database").ODatabaseSession;
const ODatabaseSessionPool = require("./database").ODatabaseSessionPool;
const Errors = require("../errors");
const Promise = require("bluebird");
const EventEmitter = require("events").EventEmitter;

const Manager = require("./migration").Manager;

class OrientDBClient extends EventEmitter {
  /**
   * Create an OrientDBClient;
   * @constructor
   * @param {Object} config
   * @param {String} [config.host=localhost] OrientDB address
   * @param {Number} [config.port=2424] OrientDB port
   * @param {Array}  [config.servers=[]] Additional servers for HA
   * @param {Object} [config.pool={ max: 5, min :1 }] Connection pool settings
   * @param {Object} [config.subscribePool={ max:2 }] Connection pool settings for subscriber operations
   * @param {Object} [config.logger=null] OrientJS Logger
   * @returns {OrientDBClient} An instance of OrientDBClient
   */
  constructor(config) {
    super();
    this.config = config;
    this.cluster = new OCluster(config);
    this.connecting = null;
    this._configureLogger(config.logger || {});
  }

  /**
   * Connect to OrientDB
   * @returns {Promise<OrientDBClient>} A promise of an instance of OrientDBClient
   */
  connect() {
    if (!this.connecting) {
      if (this.connected) {
        return Promise.resolve(this);
      }
      if (!this.cluster) {
        this.cluster = new OCluster();
      }
      this.connecting = this.cluster
        .connect()
        .then(cluster => {
          cluster.on("cluster-config", config => {
            this.emit("cluster-config", config);
          });
          this.connecting = null;
          this.connected = true;
          return this;
        })
        .catch(err => {
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
      debug: config.debug || function() {} // do not log debug by default
    };
    return this;
  }

  /**
   * Open a single session with a given config
   * @param {Object} options Session options
   * @param {String} options.name Database name
   * @param {String} options.username Username
   * @param {String} options.password Password
   * @returns {Promise<ODatabaseSession>}
   */
  session(options) {
    let db = new ODatabaseSession(this, options);
    return db.open();
  }

  /**
   * Open a pool of sessions with a given config
   * @param {Object} config
   * @param {Object} options Session options
   * @param {String} options.name Database name
   * @param {String} options.username Username
   * @param {String} options.password Password
   * @param {Object} [options.pool={min : 1,max :5}] Pool configuration
   * @returns {Promise<ODatabasePool>}
   */
  sessions(config) {
    let pool = new ODatabaseSessionPool(this, config);

    return new Promise((resolve, reject) => {
      pool
        .acquire()
        .then(session => {
          return session.close();
        })
        .then(() => {
          resolve(pool);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  migrator(config) {
    let db = new ODatabaseSession(this, config);
    return db.open().then(db => {
      return new Manager({
        db: db,
        dir: config.dir
      });
    });
  }

  /**
   * Create a database with a given config
   * @param {Object} options The options object.
   * @param {String} options.username  Server user
   * @param {String} options.password  Server password
   * @param {String} options.name The database name
   * @param {String} options.type The database type
   * @param {String} options.storage The database storage type
   * @returns {Promise}
   */
  createDatabase(options) {
    options = options || {};
    if (typeof options === "string" || typeof options === "number") {
      options = {
        username: "root",
        password: "root",
        name: "" + options,
        type: "graph",
        storage: "plocal"
      };
    } else {
      options = {
        username: options.username || "root",
        password: options.password || "root",
        name: options.name,
        type: options.type || options.type,
        storage: options.storage || options.storage || "plocal"
      };
    }
    if (!options.name) {
      return Promise.reject(
        new Errors.Config("Cannot create database, no name specified.")
      );
    }
    if (options.type !== "document" && options.type !== "graph") {
      options.type = "graph";
    }
    if (options.storage !== "plocal" && options.storage !== "memory") {
      options.storage = "plocal";
    }
    this.logger.debug("Creating database " + options.name);
    let ctx = {};
    let { username, password } = options;
    return this._runAsAdmin(options, ctx => {
      return ctx.conn.send(
        "db-create",
        Object.assign({}, options, {
          sessionId: ctx.sessionId,
          token: ctx.token
        })
      );
    });
  }

  /**
   * Drop a database with a given config
   * @param {String} username  Server user
   * @param {String} password  Server password
   * @param {Object} options Options object
   * @param {String} options.username  Server user
   * @param {String} options.password  Server password
   * @param {String} options.name Database name
   * @param {String} options.storage Storage type
   * @returns {Promise}
   */
  dropDatabase(options) {
    return this._runAsAdmin(options, ctx => {
      return ctx.conn.send(
        "db-delete",
        Object.assign({}, options, {
          sessionId: ctx.sessionId,
          token: ctx.token
        })
      );
    });
  }

  _sendClose(ctx) {
    return ctx.conn.send("db-close", {
      sessionId: ctx.sessionId,
      token: ctx.token
    });
  }

  /**
   * Determine whether a database exists with the given config.
   * @param {Object} options Options object
   * @param {String} options.username  Server user
   * @param {String} options.password  Server password
   * @param {String} options.name Database name
   * @param {String} options.storage Storage type
   * @returns {Promise}
   */
  existsDatabase(options) {
    return this._runAsAdmin(options, ctx => {
      return ctx.conn
        .send(
          "db-exists",
          Object.assign({}, options, {
            sessionId: ctx.sessionId,
            token: ctx.token
          })
        )
        .then(response => {
          return response.exists;
        });
    });
  }

  _runAsAdmin(options, work) {
    return new Promise((resolve, reject) => {
      let ctx = { options: options };
      let { username, password } = options;
      this.connect()
        .then(() => {
          return this.cluster.acquireFrom();
        })
        .then(resource => {
          ctx.conn = resource.connection;
          return ctx.conn
            .send("connect", {
              username: username,
              password: password,
              useToken: true
            })
            .then(response => {
              ctx.sessionId = response.sessionId;
              ctx.token = response.token;
              return work(ctx);
            })
            .then(response => {
              ctx.response = response;
              return this._sendClose(ctx);
            })
            .then(() => {
              return ctx.conn.close();
            })
            .then(() => {
              resolve(ctx.response);
            })
            .catch(err => {
              let promises = [];
              if (ctx.sessionId) {
                promises.push(this._sendClose(ctx));
              }
              promises.push(ctx.conn.close());
              Promise.all(promises)
                .then(() => {
                  reject(err);
                })
                .catch(() => {
                  reject(err);
                });
            });
        });
    });
  }

  /**
   * Close the underlying connections and sessions/pools allocated
   */
  close() {
    return this.cluster.close();
  }
}

/**
 * Connect to OrientDB with a given configuration
 * @method
 * @static
 * @param {Object} options
 * @param {String} [options.host=localhost] OrientDB address
 * @param {Number} [options.port=2424] OrientDB port
 * @param {Array}  [options.servers=[]] Additional servers for HA
 * @param {Object} [options.pool={ max: 5, min :1 }] Connection pool settings
 * @param {Object} [options.logger=null] OrientJS Logger
 * @returns {Promise<OrientDBClient>} A promise of an instance of OrientDBClient
 */
OrientDBClient.connect = options => {
  return new OrientDBClient(options).connect();
};
module.exports = OrientDBClient;
