/*jshint esversion: 6 */
"use strict";
let Connection = require('../transport/binary/connection');

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

  forceClose() {
    return super.close();
  }
}

module.exports = ONetworkConnection;