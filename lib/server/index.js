"use strict";

var ConnectionPool = require("../transport/binary/connection-pool"),
  Connection = require("../transport/binary/connection"),
  BinaryTransport = require("../transport/binary"),
  RestTransport = require("../transport/rest"),
  utils = require("../utils"),
  errors = require("../errors"),
  Db = require("../db/index"),
  Promise = require("bluebird"),
  net = require("net"),
  util = require("util"),
  EventEmitter = require("events").EventEmitter;

/**
 * # Server
 * Represents a connection to an orientdb server.
 *
 * @param {String|Object} options The server URL, or configuration object
 */
function Server(options) {
  this.configure(options || {});
  this.init();
  this.augment("config", require("./config"));
  EventEmitter.call(this);
  this.setMaxListeners(Infinity);
  this.connected = false;
}

util.inherits(Server, EventEmitter);

Server.extend = utils.extend;
Server.prototype.augment = utils.augment;

module.exports = Server;

Object.defineProperty(Server.prototype, "token", {
  get: function() {
    return this.transport.token;
  },
  set: function(token) {
    if (typeof token === "string") {
      token = Buffer.from(token, "base64");
    }
    this.transport.token = token;
  }
});

/**
 * Configure the server instance.
 *
 * @param  {Object} config The configuration for the server.
 * @return {Server}            The configured server object.
 */
Server.prototype.configure = function(config) {
  this.useToken = config.useToken || false;
  this.configuration = Object.assign({}, config);
  this.configureLogger(config.logger || {});
  this.configureTransport(config);
};

/**
 * Configure the transport for the server.
 *
 * @param  {Object} config The server config.
 * @return {Server}        The configured server object.
 */
Server.prototype.configureTransport = function(config) {
  if (config.transport === "rest") {
    this.transport = new RestTransport(config);
  } else {
    this.transport = new BinaryTransport(config);
  }
  this.transport.on(
    "reset",
    function() {
      this.emit("reset");
    }.bind(this)
  );
  return this;
};

/**
 * Configure the logger for the server.
 *
 * @param  {Object} config The logger config
 * @return {Server}        The server instance with the configured logger.
 */
Server.prototype.configureLogger = function(config) {
  this.logger = {
    error: config.error || console.error.bind(console),
    log: config.log || console.log.bind(console),
    debug: config.debug || function() {} // do not log debug by default
  };
  return this;
};

/**
 * Initialize the server instance.
 */
Server.prototype.init = function() {};

/**
 * Send an operation to the server,
 *
 * @param  {Integer} operation The id of the operation to send.
 * @param  {Object} options    The options for the operation.
 * @promise {Mixed}            The result of the operation.
 */
Server.prototype.send = function(operation, options) {
  return new Promise(function(resolve,reject){
      this.withRetry(10,resolve,reject,operation,options);
  }.bind(this));
};


Server.prototype.withRetry = function(times,resolve,reject,operation,options) {
  this.transport.send(operation,options)
  .bind(this)
  .then(resolve)
  .catch(function(err){

    if(err.type === 'com.orientechnologies.orient.enterprise.channel.binary.ODistributedRedirectException') {
      if(times === 0 ){
          reject(err);
        }else {
          this.withRetry(times--,resolve,reject,operation,options);
      }
    }else {
      reject(err);
    }
  });
};

/**
 * Close the connection to the server.
 *
 * @return {Server} the disconnected server instance
 */
Server.prototype.close = function() {
  this.transport.close();
  return this;
};

// # Database Related Methods

/**
 * Use the database with the given name / config.
 *
 * @param  {String|Object} config The database name, or configuration object.
 * @return {Db}                   The database instance.
 */
Server.prototype.use = function(config) {
  if (!config) {
    throw new errors.Config("Cannot use a database without a name.");
  }

  if (typeof config === "string") {
    config = {
      name: config,
      server: this
    };
  } else {
    config.server = this;
    if (config.username) {
      this.transport.username = config.username;
      this.transport.skipServerConnect = true;
    }
    if (config.password) {
      this.transport.password = config.password;
      this.transport.skipServerConnect = true;
    }
  }

  if (!config.name) {
    throw new errors.Config("Cannot use a database without a name.");
  }

  if (config.useToken == null) {
    config.useToken = this.useToken;
  }

  return new Db(config);
};

/**
 * Create a database with the given name / config.
 *
 * @param  {String|Object} config The database name or configuration object.
 * @promise {Db}                  The database instance
 */
Server.prototype.create = function(config) {
  return this.connect()
    .bind(this)
    .then(function() {
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
          new errors.Config("Cannot create database, no name specified.")
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

      config.sessionId = this.sessionCfg.sessionId;
      config.token = this.sessionCfg.token;

      return this.send("db-create", config)
        .bind(this)
        .then(function(response) {
          config.server = this;
          return new Db(config);
        });
    });
};

/**
 * Destroy a database with the given name / config.
 *
 * @param   {String|Object} config The database name or configuration object.
 * @promise {Mixed}               The server response.
 */
Server.prototype.drop = function(config) {
  return this.connect()
    .bind(this)
    .then(function() {
      config = config || "";

      if (typeof config === "string" || typeof config === "number") {
        config = {
          name: "" + config,
          storage: "plocal"
        };
      } else {
        config = {
          name: config.name,
          storage: config.storage || config.storage || "plocal"
        };
      }

      if (!config.name) {
        return Promise.reject(
          new errors.Config("Cannot destroy, no database specified.")
        );
      }
      this.logger.debug("Deleting database " + config.name);

      config.sessionId = this.sessionCfg.sessionId;
      config.token = this.sessionCfg.token;
      return this.send("db-delete", config).return(true);
    });
};

/**
 * List all the databases on the server.
 *
 * @return {Db[]} An array of databases.
 */
Server.prototype.list = function() {
  return this.connect()
    .bind(this)
    .then(function() {
      return this.send("db-list", this.sessionCfg)
        .bind(this)
        .then(function(results) {
          var names = Object.keys(results.databases),
            total = names.length,
            databases = [],
            name,
            i,
            db,
            cs;

          for (i = 0; i < total; i++) {
            name = names[i];
            cs = results.databases[name];
            databases.push(
              new Db({
                server: this,
                name: name,
                storage: cs.match(/^(.+):/)[1]
              })
            );
          }

          return databases;
        });
    });
};

/**
 * Determine whether a database exists with the given name.
 *
 * @param   {String} name        The database name.
 * @param   {String} storageType The storage type, defaults to `plocal`.
 * @promise {Boolean}            true if the database exists.
 */
Server.prototype.exists = function(name, storageType) {
  return this.connect()
    .bind(this)
    .then(function() {
      var config;
      if (typeof name === "object" && name.name) {
        config = name;
        name = config.name;
        storageType = storageType || config.storage;
      }
      storageType = storageType || "plocal";

      return this.send("db-exists", {
        name: "" + name,
        storage: storageType.toLowerCase(),
        sessionId: this.sessionCfg.sessionId,
        token: this.sessionCfg.token
      }).then(function(response) {
        return response.exists;
      });
    });
};

// deprecated name
Server.prototype.exist = Server.prototype.exists;

/**
 * Freeze the database with the given name.
 *
 * @param   {String} name        The database name.
 * @param   {String} storageType The storage type, defaults to `plocal`.
 * @return {Object}              The response from the server.
 */
Server.prototype.freeze = function(name, storageType) {
  return this.connect()
    .bind(this)
    .then(function() {
      var config;

      storageType = storageType || "plocal";
      config = {
        name: name,
        storage: storageType.toLowerCase()
      };

      if (!config.name) {
        return Promise.reject(
          new errors.Config("Cannot freeze, no database specified.")
        );
      }

      this.logger.debug("Freeze database " + config.name);
      config.sessionId = this.sessionCfg.sessionId;
      config.token = this.sessionCfg.token;
      return this.send("db-freeze", config).return(true);
    });
};

/**
 * Release the database with the given name.
 *
 * @param   {String} name        The database name.
 * @param   {String} storageType The storage type, defaults to `plocal`.
 * @return {Object}              The response from the server.
 */

Server.prototype.release = function(name, storageType) {
  return this.connect()
    .bind(this)
    .then(function() {
      var config;

      storageType = storageType || "plocal";
      config = {
        name: name,
        storage: storageType.toLowerCase()
      };

      if (!config.name) {
        return Promise.reject(
          new errors.Config("Cannot release, no database specified.")
        );
      }

      config.sessionId = this.sessionCfg.sessionId;
      config.token = this.sessionCfg.token;

      this.logger.debug("Release database " + config.name);
      return this.send("db-release", config).return(true);
    });
};

Server.prototype.shutdown = function() {
  var config = {
    username: this.transport.username,
    password: this.transport.password
  };
  return this.send("server-shutdown", config).return(true);
};

Server.prototype.connect = function() {
  if (!this.configuration.username || !this.configuration.password) {
    return Promise.reject(
      new errors.Config(
        "Cannot connect to the server without server credentials"
      )
    );
  }
  var config = {
    username: this.configuration.username,
    password: this.configuration.password,
    useToken: this.configuration.useToken || false
  };
  if (!this.connected) {
    this.connected = this.send("connect", config)
      .bind(this)
      .then(function(response) {
        this.connected = true;
        this.sessionCfg = response;
      });
    return this.connected;
  } else {
    if (this.connected === true) {
      return Promise.resolve(this);
    } else {
      return this.connected;
    }
  }
};
