"use strict";

function Oriento (config) {
  return new Oriento.Server(config);
}

Oriento.RecordID = Oriento.RecordId = Oriento.RID = require('./recordid');

Oriento.Server = require('./server');
Oriento.Db = require('./db');
Oriento.protocol = require('./protocol');
Oriento.errors = require('./errors');
Oriento.Migration = require('./migration');
Oriento.CLI = require('./cli');
module.exports = Oriento;
