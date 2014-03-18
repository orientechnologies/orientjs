"use strict";

function OrientDB (config) {
  return new OrientDB.Server(config);
}

OrientDB.RecordID = OrientDB.RecordId = OrientDB.RID = require('./recordid');

OrientDB.Server = require('./server');
OrientDB.Db = require('./db');
OrientDB.protocol = require('./protocol');
OrientDB.errors = require('./errors');
OrientDB.Migration = require('./migration');
module.exports = OrientDB;
