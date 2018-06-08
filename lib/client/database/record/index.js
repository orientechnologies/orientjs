/*jshint esversion: 6 */
"use strict";

const Record = require("../../../db/record");
const Promise = require("bluebird"),
  RID = require("../../../recordid"),
  errors = require("../../../errors");

module.exports = exports;

Object.keys(Record).forEach(k => {
  exports[k] = Record[k];
});

/**
 * Internal. Insert the given record into the database.
 *
 * @param  {Object} record  The record to insert.
 * @param  {Object} options The command options.
 * @promise {Object}        The inserted record.
 */
const internalCreate = function(record, options) {
  if (Array.isArray(record)) {
    return Promise.all(
      record.map(function(record) {
        return this.record.create(record, options);
      }, this)
    );
  }
  let className = record["@class"] || "",
    rid;

  options = options || {};
  if (record["@rid"]) {
    return Promise.reject(
      new errors.Operation("Cannot create record - RecordID should be empty")
    );
  }
  if (className === "") {
    return Promise.reject(
      new errors.Operation("Cannot create record - Class is invalid.")
    );
  }
  return this.send("record-create", {
    segment: options.segment != null ? +options.segment : -1,
    type: record["@type"],
    record: record
  }).then(function(results) {
    record["@rid"] = new RID({
      cluster: results.cluster,
      position: results.position
    });
    record["@version"] = results.version;
    return record;
  });
};

const internalUpdate = function(record, options) {
  var extracted = extractRecordId(record),
    rid = extracted[0],
    promise,
    data;

  record = extracted[1];

  options = options || {};

  if (!rid) {
    return Promise.reject(
      new errors.Operation(
        "Cannot update record -  record ID is not specified or invalid."
      )
    );
  }

  if (!record["@type"]) {
    record["@type"] = "d";
  }

  data = {
    cluster: rid.cluster,
    position: rid.position,
    type: record["@type"],
    mode: options.mode || 0
  };

  if (options.preserve && rid) {
    promise = this.record.get(rid).then(function(found) {
      var keys, total, key, i;
      if (found["@type"] === "b") {
        keys = Object.keys(found);
        total = keys.length;
        var foundClone = new Buffer(record);
        for (i = 0; i < total; i++) {
          key = keys[i];
          if (key.charAt(0) === "@") {
            foundClone[key] = found[key];
          }
        }

        keys = Object.keys(record);
        total = keys.length;
        for (i = 0; i < total; i++) {
          key = keys[i];
          if (key.charAt(0) === "@") {
            foundClone[key] = record[key];
          }
        }
        return foundClone;
      } else {
        keys = Object.keys(record);
        total = keys.length;
        for (i = 0; i < total; i++) {
          key = keys[i];
          found[key] = record[key];
        }
        return found;
      }
    });
  } else {
    promise = Promise.resolve(record);
  }

  return promise.bind(this).then(function(record) {
    data.record = record;
    return this.send("record-update", data).then(function(results) {
      record["@version"] = (results ? results.version : 0) || 0;
      return record;
    });
  });
};

const internalDelete = function(record, options) {
  if (!record) {
    return Promise.reject(
      new errors.Operation("Cannot delete - no record specified")
    );
  }
  var extracted = extractRecordId(record),
    rid = extracted[0];

  record = extracted[1];

  options = options || {};

  if (!rid) {
    return Promise.reject(
      new errors.Operation("Cannot delete - no record id specified")
    );
  }
  return this.send("record-delete", {
    cluster: rid.cluster,
    position: rid.position,
    version: record["@version"] != null ? +record["@version"] : -1,
    mode: options.mode || 0
  }).then(function(response) {
    return record;
  });
};

const txAwareOperation = function(op) {
  return function(record, options) {
    if (this.tx()) {
      return this.tx()
        ._flush()
        .then(() => {
          return op.bind(this)(record, options);
        });
    } else {
      return op.bind(this)(record, options);
    }
  };
};

const InternalDeleteTx = function(record, options) {
  return internalDelete
    .bind(this)(record, options)
    .then(res => {
      if (this.tx()) {
        if (Array.isArray(record)) {
          record.forEach(r => {
            this.tx()._finalDeleted.push(r);
          });
        } else {
          this.tx()._finalDeleted.push(record);
        }
      }
      return res;
    });
};

/**
 * Insert the given record into the database.
 *
 * @param  {Object} record  The record to insert.
 * @param  {Object} options The command options.
 * @promise {Object}        The inserted record.
 */
exports.create = txAwareOperation(internalCreate);

/**
 * Update the given record.
 *
 * @param  {Object} record  The record to update.
 * @param  {Object} options The query options.
 * @promise {Object}        The updated record.
 */
exports.update = txAwareOperation(internalUpdate);

/**
 * Delete the given record.
 *
 * @param   {String|RID|Object} record  The record or record id to delete.
 * @param   {Object}            options The query options.
 * @promise {Object}                    The deleted record object.
 */
exports.delete = txAwareOperation(InternalDeleteTx);

/**
 * Extract the record id and record from the given argument.
 *
 * @param  {String|RID|Object} record The record.
 * @return {[RID, Object]}            The record id and object.
 */
function extractRecordId(record) {
  var rid = false;
  if (typeof record === "string") {
    rid = RID.parse(record);
    record = {
      "@rid": rid
    };
  } else if (record instanceof RID) {
    rid = record;
    record = {
      "@rid": rid
    };
  } else if (record["@rid"]) {
    record["@rid"] = rid = RID.parse(record["@rid"]);
  }
  return [rid, record];
}
