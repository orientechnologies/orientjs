"use strict";

var Promise = require('bluebird'),
    RID = require('../recordid'),
    errors = require('../errors');

/**
 * # Transactions
 *
 *
 * @param {Db}      db  The database the transaction is for.
 * @param {Integer} id  The transaction id.
 */
function Transaction (db, id) {
  this.db = db;
  this.id = id;
  this._pos = -1;
  this._creates = [];
  this._updates = [];
  this._deletes = [];
}

module.exports = Transaction;

/**
 * Commit the transaction.
 *
 * @promise {Object} The results of the transaction.
 */
Transaction.prototype.commit = function () {
  return this.db.cluster.list()
  .bind(this)
  .then(function () {
    var ids = {};
    return [
      this._creates.map(resolveClusterId, this),
      this._updates.map(resolveClusterId, this),
      this._deletes.map(resolveClusterId, this)
    ];
    function resolveClusterId (item) {
      var className = (item[0]['@class'] || '').toLowerCase();
      if (className) {
        if (ids[className] == null) {
          ids[className] = this.db.cluster.cached.names[className].id;
        }
        item[0]['@rid'].cluster = ids[className];
      }
      return item;
    }
  })
  .spread(function (creates, updates, deletes) {
    return this.db.send('tx-commit', {
      storageType: this.db.storage,
      txLog: true,
      txId: this.id,
      creates: creates,
      updates: updates,
      deletes: deletes
    });
  })
  .then(function (result) {
    console.log(result);
    return result;
  });

};

/**
 * Insert the given record into the database.
 *
 * @param  {Object} record  The record to insert.
 * @promise {Object}        The inserted record.
 */
Transaction.prototype.create = function (record) {
  if (Array.isArray(record)) {
    return Promise.all(record.map(this.create, this));
  }
  var deferred = Promise.defer();
  record['@rid'] = new RID({
    cluster: -1,
    position: (--this._pos)
  });
  this._creates.push([record, deferred]);
  return deferred.promise;
};


/**
 * Resolve references to child records for the given record.
 *
 * @param  {Object}   record   The primary record.
 * @param  {Object[]} children The child records.
 * @return {Object}            The primary record with references replaced.
 */
Transaction.prototype.resolveReferences = function (record, children) {
  var total = children.length,
      indexed = {},
      replaceRecordIds = recordIdResolver(),
      child, i;

  for (i = 0; i < total; i++) {
    child = children[i];
    indexed[child['@rid']] = child;
  }

  for (i = 0; i < total; i++) {
    child = children[i];
    replaceRecordIds(indexed, child);
  }

  return replaceRecordIds(indexed, record);
};

function recordIdResolver () {
  var seen = {};
  return replaceRecordIds;
  /**
   * Replace references to records with their instances, where possible.
   *
   * @param  {Object} records The map of record ids to record instances.
   * @param  {Object} obj     The object to replace references within
   * @return {Object}         The object with references replaced.
   */
  function replaceRecordIds (records, obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    else if (Array.isArray(obj)) {
      /*jshint validthis:true */
      return obj.map(replaceRecordIds.bind(this, records));
    }
    else if (obj instanceof RID && records[obj]) {
      return records[obj];
    }
    if (obj['@rid']) {
      if (seen[obj['@rid']]) {
        return seen[obj['@rid']];
      }
      else {
        seen[obj['@rid']] = obj;
      }
    }
    var keys = Object.keys(obj),
        total = keys.length,
        i, key, value;

    for (i = 0; i < total; i++) {
      key = keys[i];
      value = obj[key];
      if (!value || typeof value !== 'object' || key[0] === '@') {
        continue;
      }
      if (value instanceof RID) {
        if (records[value]) {
          obj[key] = records[value];
        }
      }
      else if (Array.isArray(value)) {
        obj[key] = value.map(replaceRecordIds.bind(this, records));
      }
      else {
        obj[key] = replaceRecordIds(records, value);
      }
    }
    return obj;
  }
}

/**
 * Update the given record.
 *
 * @param  {Object} record  The record to update.
 * @param  {Object} options The query options.
 * @promise {Object}        The updated record.
 */
Transaction.prototype.update = function (record, options) {
  var extracted = extractRecordId(record),
      rid = extracted[0],
      promise, data;

  record = extracted[1];

  options = options || {};

  if (!rid) {
    return Promise.reject(new errors.Operation('Cannot update record -  record ID is not specified or invalid.'));
  }

};

/**
 * Delete the given record.
 *
 * @param   {String|RID|Object} record  The record or record id to delete.
 * @param   {Object}            options The query options.
 * @promise {Object}                    The deleted record object.
 */
Transaction.prototype.delete = function (record, options) {
  if (!record) {
    return Promise.reject(new errors.Operation('Cannot delete - no record specified'));
  }
  var extracted = extractRecordId(record),
      rid = extracted[0];

  record = extracted[1];

  options = options || {};

  if (!rid) {
    return Promise.reject(new errors.Operation('Cannot delete - no record id specified'));
  }

};

/**
 * Extract the record id and record from the given argument.
 *
 * @param  {String|RID|Object} record The record.
 * @return {[RID, Object]}            The record id and object.
 */
function extractRecordId (record) {
  var rid = false;
  if (typeof record === 'string') {
    rid = RID.parse(record);
    record = {
      '@rid': rid
    };
  }
  else if (record instanceof RID) {
    rid = record;
    record = {
      '@rid': rid
    };
  }
  else if (record['@rid']) {
    record['@rid'] = rid = RID.parse(record['@rid']);
  }
  return [rid, record];
}