/*jshint esversion: 6 */
"use strict";

const Promise = require("bluebird");
const errors = require("../../errors");
const ConnectionError = require("../../errors").ConnectionError;
const RequestError = require("../../errors").RequestError;

class SessionManager {
  constructor(client, config) {
    this.client = client;
    this.name = config.name;
    this.type = config.type === "document" ? "document" : "graph";
    this.storage = config.storage === "plocal" || config.storage === "memory" ? config.storage : "plocal";
    this.username = config.username || "admin";
    this.password = config.password || "admin";
    this.currentSession = null;
    this.sessions = {};
  }

  open() {
    if (this.currentSession != null && this.currentSession.sessionId !== -1) {
      return Promise.resolve(this.currentSession);
    }

    if (this.opening) {
      return this.opening;
    }
    this.client.logger.debug("opening database session to " + this.name);
    this.opening = this.client.cluster.acquireFrom().then(resource => {
      let server = resource.server;
      let connection = resource.connection;
      this.client.logger.debug(`Opening database session to ${this.name}`);
      return new Promise((resolve, reject) => {
        connection
          .send("db-open", {
            name: this.name,
            type: this.type,
            username: this.username,
            password: this.password,
            useToken: true
          })
          .bind(this)
          .then(response => {
            this.client.logger.debug(
              `Got session id ${response.sessionId} for database ${this.name}`
            );
            this.currentSession = {
              sessionId: response.sessionId,
              token: response.token,
              server: server
            };
            this.sessionId = response.sessionId;
            this.serverCluster = response.serverCluster;
            this.release = response.release;
            this.token = response.token;
            return server
              .subscribeCluster({
                sessionId: this.sessionId,
                token: this.token
              })
              .then(() => {
                return connection.close();
              });
          })
          .bind(this)
          .then(() => {
            this.opening = null;
            resolve(this.currentSession);
          })
          .catch(err => {
            connection.close().then(() => {
              reject(err);
            });
          });
      });
    });
    return this.opening;
  }

  current() {
    return this.currentSession;
  }

  /**
   * Acquire a Session and a Connection for the current Operation
   * @param op
   * @param data
   * @return {*}
   */

  acquireSession(op, data) {
    if (this.currentSession != null && this.currentSession.sessionId !== -1) {
      return this.currentSession.server.acquireConnection().then(connection => {
        let session = this.currentSession;
        return { session, connection };
      });
    } else {
      return Promise.reject(
        new errors.ConnectionError(11, "Cannot acquire a valid session")
      );
    }
  }

  acquireSubscribeSession(op, data) {
    if (this.currentSession != null && this.currentSession.sessionId !== -1) {
      return this.currentSession.server
        .acquireForSubscribe()
        .then(connection => {
          let session = this.currentSession;
          return { session, connection };
        });
    } else {
      return Promise.reject(
        new errors.ConnectionError(11, "Cannot acquire a valid session")
      );
    }
  }

  sendOnSubscribe(db, op, data, onAcquire) {
    return this.withRetrySession(
      op,
      data,
      () => {
        return this.acquireSubscribeSession(op, data);
      },
      resource => {
        if (onAcquire) {
          onAcquire(resource);
        }
        let session = resource.session;
        let connection = resource.connection;
        data = data || {};
        data.token = session.token;
        data.sessionId = session.sessionId;
        data.database = this.name;
        data.db = this;
        data.transformerFunctions = db.transformerFunctions;
        this.client.logger.debug(
          "Sending subscribe operation " + op + " for database " + this.name
        );
        return connection.send(op, data);
      }
    );
  }

  send(db, op, data) {
    return this.withRetrySession(
      op,
      data,
      () => {
        return this.acquireSession(op, data);
      },
      resource => {
        let session = resource.session;
        let connection = resource.connection;
        data = data || {};
        data.token = session.token;
        data.sessionId = session.sessionId;
        data.database = this.name;
        data.db = this;
        data.transformerFunctions = db.transformerFunctions;
        this.client.logger.debug(
          "Sending operation " + op + " for database " + this.name
        );
        return connection.send(op, data);
      }
    );
  }

  withSession(op, data, acquire, cbk) {
    return new Promise((resolve, reject) => {
      var connection;
      var closed = false;
      var result;
      acquire(op, data)
        .then(resource => {
          connection = resource.connection;
          return cbk(resource);
        })
        .then(res => {
          result = res;
          return connection.close();
        })
        .then(() => {
          closed = true;
          resolve(result);
        })
        .catch(err => {
          if (!closed && connection) {
            connection.close();
          }
          reject(err);
        });
    });
  }

  withRetrySession(op, data, acquire, cbk) {
    return new Promise((resolve, reject) => {
      this.withSession(op, data, acquire, cbk)
        .then(resolve)
        .catch(err => {
          // TODO Handle retry
          if (
            err instanceof ConnectionError ||
            (err instanceof RequestError && err.isTokenException())
          ) {
            this.currentSession = null;
            this.open()
              .then(this.withSession.bind(this, op, data, acquire, cbk))
              .catch(reject);
          } else {
            reject(err);
          }
        });
    });
  }

  close() {
    return this.withSession(
      "db-close",
      {},
      () => {
        return this.acquireSession("db-close", {});
      },
      resource => {
        let session = resource.session;
        let connection = resource.connection;
        this.client.logger.debug(
          `Closing session id ${session.sessionId} for database ${this.name}`
        );
        return connection
          .send("db-close", {
            sessionId: session.sessionId,
            token: session.token
          })
          .bind(this)
          .then(() => {
            this.client.logger.debug(
              `Closed session id ${session.sessionId} for database ${this.name}`
            );
            this.currentSession = null;
            return this;
          });
      }
    );
  }
}

module.exports = SessionManager;
