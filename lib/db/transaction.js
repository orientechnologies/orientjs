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
      var className = (item['@class'] || '').toLowerCase();
      if (className) {
        if (ids[className] == null) {
          ids[className] = this.db.cluster.cached.names[className].id;
        }
        item['@rid'].cluster = ids[className];
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
    })
    .then(function (response) {
      return [creates, updates, deletes, response];
    });
  })
  .spread(function (creates, updates, deletes, response) {
    return {
      created: response.created.map(function (result) {
        var total = creates.length,
            item, i;
        for (i = 0; i < total; i++) {
          item = creates[i];
          if (item['@rid'].cluster === result.tmpCluster &&
              item['@rid'].position === result.tmpPosition) {

            item['@rid'].cluster = result.cluster;
            item['@rid'].position = result.position;
            return item;
          }
        }
      })
      .filter(notEmpty),
      updated: response.updated.map(function (result) {
        var total = updates.length,
            item, i;
        for (i = 0; i < total; i++) {
          item = updates[i];
          if (item['@rid'].cluster === result.cluster &&
              item['@rid'].position === result.position) {

            item['@version'] = result.version;
            return item;
          }
        }
      })
      .filter(notEmpty),
      deleted: deletes.filter(notEmpty)
    };
  });
};

function notEmpty (item) { return item; }

/**
 * Insert the given record into the database.
 *
 * @param  {Object} record  The record to insert.
 * @return {Transaction}    The transaction instance.
 */
Transaction.prototype.create = function (record) {
  if (Array.isArray(record)) {
    return record.map(this.create, this);
  }
  record['@rid'] = new RID({
    cluster: -1,
    position: (--this._pos)
  });
  this._creates.push(record);
  return this;
};


/**
 * Update the given record.
 *
 * @param  {Object} record  The record to update.
 * @return {Transaction}    The transaction instance.
 */
Transaction.prototype.update = function (record) {
  if (Array.isArray(record)) {
    return record.map(this.update, this);
  }
  var extracted = extractRecordId(record),
      rid = extracted[0];

  record = extracted[1];

  if (!rid) {
    throw new errors.Operation('Cannot update record -  record ID is not specified or invalid.');
  }

  this._updates.push(record);
  return this;
};

/**
 * Delete the given record.
 *
 * @param  {String|RID|Object} record  The record or record id to delete.
 * @return {Transaction}               The transaction instance.
 */
Transaction.prototype.delete = function (record) {
  if (Array.isArray(record)) {
    return record.map(this.delete, this);
  }
  var extracted = extractRecordId(record),
      rid = extracted[0];

  record = extracted[1];

  if (!rid) {
    throw new errors.Operation('Cannot delete record -  record ID is not specified or invalid.');
  }

  this._deletes.push(record);
  return this;
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