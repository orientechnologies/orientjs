"use strict";

function Oriento (config) {
  return new Oriento.Server(config);
}

Oriento.RecordID = Oriento.RecordId = Oriento.RID = require('./recordid');
Oriento.RIDBag = Oriento.Bag = require('./bag');
Oriento.Server = require('./server');
Oriento.Db = require('./db');
Oriento.transport = require('./transport');
Oriento.errors = require('./errors');
Oriento.Migration = require('./migration');
Oriento.CLI = require('./cli');

/**
 * A list of orientdb data types, indexed by their type id.
 * @type {Object}
 */
Oriento.types = {
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

module.exports = Oriento;
