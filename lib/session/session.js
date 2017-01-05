/*jshint esversion: 6 */
"use strict";

let DB = require('../db/db');

class OSession extends DB {

  constructor(config) {
    super(config);
  }

}


module.exports = OSession;