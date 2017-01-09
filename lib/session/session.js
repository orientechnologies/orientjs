/*jshint esversion: 6 */
"use strict";

let DB = require('../db/db');
let Promise = require('bluebird');

class OSession extends DB {

  constructor(client, config) {
    super(config);
    this.client = client;
  }


  configure(config) {
    this.sessionId = -1;
    this.forcePrepare = config.forcePrepare != null ? config.forcePrepare : true;
    this.name = config.name;
    this.type = (config.type === 'document' ? 'document' : 'graph');
    this.storage = ((config.storage === 'plocal' || config.storage === 'memory') ? config.storage : 'plocal');
    this.token = null;
    this.useToken = true;
    this.username = config.username || 'admin';
    this.password = config.password || 'admin';
    this.transactionId = 0;
    this.transformers = config.transformers || {};
    this.transformerFunctions = {};
    return this;
  }


  open() {
    if (this.sessionId != null && this.sessionId !== -1) {
      return Promise.resolve(this);
    }
    this.client.logger.debug('opening database connection to ' + this.name);
    return this.client.cluster.acquireFrom()
      .then((resource) => {
        let connection = resource.connection;
        return connection.send('db-open', {
          name: this.name,
          type: this.type,
          username: this.username,
          password: this.password,
          useToken: this.useToken
        }).bind(this).then((response) => {
          this.client.logger.debug('Got session id ' + response.sessionId + ' for database ' + this.name);
          this.sessionId = response.sessionId;
          this.cluster.cacheData(response.clusters);
          this.serverCluster = response.serverCluster;
          this.release = response.release;
          this.token = response.token;
          // if (response.serverCluster && this.server.transport.connection) {
            // this.server.transport.connection.emit('update-config', response.serverCluster);
          // }
          // this.server.once('error', function () {
          //   this.sessionId = null;
          // }.bind(this));
          return connection.close();
        }).bind(this)
          .then(() => {
            return this;
          });
      });
  }

  close() {
    return this.client.cluster.acquireFrom()
      .then((resource) => {
        let conn = resource.connection;
        return conn.send('db-close', {
          sessionId: this.sessionId,
          token: this.token
        }).bind(this)
          .then(function () {
            this.sessionId = -1;
            return conn.close();
          })
          .bind(this)
          .then(() => {
            return this;
          });
      });
  }
}


module.exports = OSession;