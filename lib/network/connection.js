/*jshint esversion: 6 */
"use strict";
const Connection = require('../transport/binary/connection');
const Promise = require('bluebird');
const errors = require('../errors/');
class ONetworkConnection extends Connection {
  constructor(config, pool) {
    super(config);
    this.pool = pool;
  }


  close() {
    if (this.pool) {
      return this.pool.release(this);
    } else {
      return super.close();
    }
  }

  bindProtocol() {


    if (this.protocolVersion >= 37) {
      this.protocol = require('../transport/binary/protocol37');
    } else {
      var msg = 'Unsupported Protocol : ' + this.protocolVersion;
      throw new errors.ProtocolError(msg, msg);
    }
  }

  connect() {

    return new Promise((resolve, reject) => {
      super.connect()
        .then(() => {
          if (this.protocol.handshake) {
            return this.protocol.handshake(this);
          }
        }).then(resolve)
        .catch((err) => {
          this.destroySocket();
          reject(err);
        });
    });
  }

  forceClose() {
    return super.close();
  }
}

module.exports = ONetworkConnection;