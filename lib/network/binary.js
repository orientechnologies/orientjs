/*jshint esversion: 6 */
"use strict";

let Promise = require('bluebird');
let ONetworkPool = require('./pool');

class ONetworkBinary {

  constructor(config, pool) {

  }
}

ONetworkBinary.fromConfig = function (config) {
  let pool = new ONetworkPool(config);
  return new Promise((resolve, reject) => {
    resolve(new ONetworkBinary(config, pool));
  });
};
module.exports = ONetworkBinary;






