/*jshint esversion: 6 */
"use strict";
let Connection = require('../transport/binary/connection');

class ONetworkConnection extends Connection {
  constructor(config) {
    super(config);
  }
}

module.exports = ONetworkConnection;