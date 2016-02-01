"use strict";

function OrientDB (config) {
  return new OrientDB.Server(config);
}

OrientDB.RecordID = OrientDB.RecordId = OrientDB.RID = require('./recordid');
OrientDB.RIDBag = OrientDB.Bag = require('./bag');
OrientDB.Server = require('./server');
OrientDB.Db = require('./db');
OrientDB.Pool = require('./pool');
OrientDB.ODatabase = require('./db/odatabase');
OrientDB.Statement = OrientDB.Db.Statement;
OrientDB.Query = OrientDB.Db.Query;
OrientDB.transport = require('./transport');
OrientDB.errors = require('./errors');
OrientDB.Migration = require('./migration');
OrientDB.CLI = require('./cli');
OrientDB.utils = require('./utils');
OrientDB.jsonify = OrientDB.utils.jsonify;


/**
 * A list of orientdb data types, indexed by their type id.
 * @type {Object}
 */
OrientDB.types = {
  0: "Boolean",
  1: "Integer",
  2: "Short",
  3: "Long",
  4: "Float",
  5: "Double",
  6: "Datetime",
  7: "String",
  8: "Binary",
  9: "Embedded",
  10: "EmbeddedList",
  11: "EmbeddedSet",
  12: "EmbeddedMap",
  13: "Link",
  14: "LinkList",
  15: "LinkSet",
  16: "LinkMap",
  17: "Byte",
  18: "Transient",
  19: "Date",
  20: "Custom",
  21: "Decimal",
  22: "LinkBag",
  23: "Any"
};

module.exports = OrientDB;
