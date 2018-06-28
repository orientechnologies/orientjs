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
   * @param {String} username  Server user
   * @param {String} password  Server password
   * @param {String|Object} config The database name, or configuration object.
   * @param {String} config.name The database name
   * @param {String} config.type The database type
   * @param {String} config.storage The database storage type
   * @returns {Promise}
   */
  createDatabase(username, password, config) {
    config = config || "";

    if (typeof config === "string" || typeof config === "number") {
      config = {
        name: "" + config,
        type: "graph",
        storage: "plocal"
      };
    } else {
      config = {
        name: config.name,
        type: config.type || config.type,
        storage: config.storage || config.storage || "plocal"
      };
    }
    if (!config.name) {
      return Promise.reject(
        new Errors.Config("Cannot create database, no name specified.")
      );
    }
    if (config.type !== "document" && config.type !== "graph") {
      config.type = "graph";
    }
    if (
      config.storage !== "local" &&
      config.storage !== "plocal" &&
      config.storage !== "memory"
    ) {
      config.storage = "plocal";
    }
    this.logger.debug("Creating database " + config.name);

    let ctx = {};
    return this.cluster
      .acquireFrom()
      .then(resource => {
        ctx.conn = resource.connection;
        return ctx.conn.send("connect", {
          username: username,
          password: password,
          useToken: true
        });
      })
      .then(response => {
        ctx.sessionId = response.sessionId;
        ctx.token = response.token;
        return ctx.conn.send(
          "db-create",
          Object.assign({}, config, {
            sessionId: ctx.sessionId,
            token: ctx.token
          })
        );
      })
      .then(() => {
        return ctx.conn.send("db-close", {
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
   * @param {Object} options Options object
   * @param {String} options.name Database name
   * @param {String} options.storage Storage type
   * @returns {Promise}
   */
  dropDatabase(username, password, options) {
    let ctx = {};
    return this.connect()
      .then(() => {
        return this.cluster.acquireFrom();
      })
      .then(resource => {
        ctx.conn = resource.connection;
        return ctx.conn.send("connect", {
          username: username,
          password: password,
          useToken: true
        });
      })
      .then(response => {
        ctx.sessionId = response.sessionId;
        ctx.token = response.token;
        return ctx.conn.send(
          "db-delete",
          Object.assign({}, options, {
            sessionId: ctx.sessionId,
            token: ctx.token
          })
        );
      })
      .then(() => {
        return ctx.conn.send("db-close", {
          sessionId: ctx.sessionId,
          token: ctx.token
        });
      })
      .then(() => {
        return ctx.conn.close();
      });
  }

  /**
   * Determine whether a database exists with the given config.
   * @param {String} username  Server user
   * @param {String}password  Server password
   * @param {Object} options Options object
   * @param {String} options.name Database name
   * @param {String} options.storage Storage type
   * @returns {Promise}
   */
  existsDatabase(username, password, options) {
    let ctx = {};
    return this.connect()
      .then(() => {
        return this.cluster.acquireFrom();
      })
      .then(resource => {
        ctx.conn = resource.connection;
        return ctx.conn.send("connect", {
          username: username,
          password: password,
          useToken: true
        });
      })
      .then(response => {
        ctx.sessionId = response.sessionId;
        ctx.token = response.token;
        return ctx.conn.send(
          "db-exists",
          Object.assign({}, options, {
            sessionId: ctx.sessionId,
            token: ctx.token
          })
        );
      })
      .then(response => {
        ctx.exists = response.exists;
        return ctx.conn.send("db-close", {
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
