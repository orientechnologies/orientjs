"use strict";

var Promise = require('bluebird'),
  RID = require('../recordid'),
  RIDBag = require('../bag'),
  errors = require('../errors');

/**
 * Insert the given record into the database.
 *
 * @param  {Object} record  The record to insert.
 * @param  {Object} options The command options.
 * @promise {Object}        The inserted record.
 */
exports.create = function (record, options) {
  if (Array.isArray(record)) {
    return Promise.all(record.map(function (record) {
      return this.record.create(record, options);
    }, this));
  }
  var className = record['@class'] || '',
    rid, promise;

  options = options || {};
  if (record['@rid']) {
    promise = Promise.resolve(record['@rid']);
  }
  else if (className && className.defaultClusterId) {
    promise = Promise.resolve(new RID({
      cluster: className.defaultClusterId
    }));
  }
  else if (className !== '') {
    promise = this.cluster.getByName(className);
  }
  else {
    return Promise.reject(new errors.Operation('Cannot create record -  cluster ID and/or class is invalid.'));
  }
  return promise
    .bind(this)
    .then(function (cluster) {
      if (!cluster) {
        return Promise.reject(new errors.Operation('Cannot create record -  cluster ID and/or class is invalid.'));
      }
      else if (cluster instanceof RID) {
        rid = cluster;
      }
      else {
        rid = new RID({
          cluster: cluster.id || cluster,
          position: -1
        });
      }
      return this.send('record-create', {
        segment: options.segment != null ? +options.segment : -1,
        cluster: rid.cluster,
        type: record['@type'],
        record: record
      });
    })
    .then(function (results) {
      rid.position = results.position;
      record['@rid'] = rid;
      record['@version'] = results.version;
      return record;
    });
};

/**
 * Read the given record.
 *
 * @param  {Object} record  The record to load.
 * @param  {Object} options The query options.
 * @promise {Object}        The loaded record.
 */
exports.get = function (record, options) {
  if (Array.isArray(record)) {
    return Promise.all(record.map(function (item) {
      return this.record.get(item, options);
    }, this));
  }
  var extracted = extractRecordId(record),
    rid = extracted[0];

  record = extracted[1];

  options = options || {};

  if (!rid) {
    return Promise.reject(new errors.Operation('Cannot read - no record id specified'));
  }

  return this.send('record-load', {
      cluster: rid.cluster,
      position: rid.position,
      fetchPlan: options.fetchPlan || '',
      tombstones: options.tombstones || false
    })
    .bind(this)
    .then(function (response) {
      if (response.records.length === 0) {
        return Promise.reject(new errors.Request('No such record'));
      }
      else if (response.records.length === 1) {
        return response.records[0];
      }
      else {
        response.records = this.record.resolveReferences(response.records);
        return response.records[0];
      }
    });
};

/**
 * Resolve all references within the given collection of records.
 *
 * @param  {Object[]} records  The records to resolve.
 * @return {Object}            The records with references replaced.
 */
exports.resolveReferences = function (records, preloaded) {
  var total = records.length,
    collated = {},
    i;

  for (i = 0; i < total; i++) {
    if (records[i]) {
      if (Array.isArray(records[i])) {
        records[i] = this.record.resolveReferences(records[i], preloaded);


      } else {
        if (!collated[records[i]['@rid']]) {
          collated[records[i]['@rid']] = records[i];
        }
      }
    }
  }
  if (preloaded) {
    for (i = 0; i < preloaded.length; i++) {
      if (preloaded[i]) {
        if (!collated[preloaded[i]['@rid']]) {
          collated[preloaded[i]['@rid']] = preloaded[i];
        }
      }
    }
  }

  var replaceRecordIds = ridReplacer(collated);
  if (preloaded) {
    for (i = 0; i < preloaded.length; i++) {
      replaceRecordIds(preloaded[i]);
    }
  }

  for (i = 0; i < total; i++) {
    records[i] = replaceRecordIds(records[i]);
  }
  return records;
};


function ridReplacer(collated) {
  var seen = {};
  return replaceRecordIds;
  /**
   * Replace references to records with their instances, where possible.
   *
   * @param  {Object} obj     The object to replace references within
   * @return {Object}         The object with references replaced.
   */
  function replaceRecordIds(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    else if (Array.isArray(obj)) {
      /*jshint validthis:true */
      return obj.map(replaceRecordIds);
    }
    else if (obj instanceof RIDBag) {
      obj._prefetchedRecords = collated;
      return obj;
    }
    else if (obj instanceof RID && collated[obj]) {
      return collated[obj];
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
        if (collated[value]) {
          obj[key] = collated[value];
        }
      }
      else if (Array.isArray(value)) {
        obj[key] = value.map(replaceRecordIds);
      }
      else {
        obj[key] = replaceRecordIds(value);
      }
    }
    return obj;
  }
}
/**
 * Read the metadata for the given record.
 *
 * @param  {Object} record  The record to load.
 * @param  {Object} options The query options.
 * @promise {Object}        The record object with loaded meta data.
 */
exports.meta = function (record, options) {
  if (Array.isArray(record)) {
    return Promise.all(record.map(this.record.read, this));
  }
  var extracted = extractRecordId(record),
    rid = extracted[0];

  record = extracted[1];

  options = options || {};

  if (!rid) {
    return Promise.reject(new errors.Operation('Cannot read - no record id specified'));
  }

  return this.send('record-metadata', {
      cluster: rid.cluster,
      position: rid.position
    })
    .bind(this)
    .then(function (response) {
      record['@rid'] = rid;
      record['@version'] = response.version;
      return record;
    });
};

/**
 * Update the given record.
 *
 * @param  {Object} record  The record to update.
 * @param  {Object} options The query options.
 * @promise {Object}        The updated record.
 */
exports.update = function (record, options) {
  var extracted = extractRecordId(record),
    rid = extracted[0],
    promise, data;

  record = extracted[1];

  options = options || {};

  if (!rid) {
    return Promise.reject(new errors.Operation('Cannot update record -  record ID is not specified or invalid.'));
  }

  if (!record['@type']) {
    record['@type'] = 'd';
  }

  data = {
    cluster: rid.cluster,
    position: rid.position,
    type: record['@type'],
    mode: options.mode || 0
  };

  if (options.preserve && rid) {
    promise = this.record.get(rid)
      .then(function (found) {
        var keys, total, key, i;
        if (found['@type'] === 'b') {
          keys = Object.keys(found);
          total = keys.length;
          var foundClone = new Buffer(record);
          for (i = 0; i < total; i++) {
            key = keys[i];
            if (key.charAt(0) === '@') {
              foundClone[key] = found[key];
            }
          }

          keys = Object.keys(record);
          total = keys.length;
          for (i = 0; i < total; i++) {
            key = keys[i];
            if (key.charAt(0) === '@') {
              foundClone[key] = record[key];
            }
          }
          return foundClone;
        }
        else {
          keys = Object.keys(record);
          total = keys.length;
          for (i = 0; i < total; i++) {
            key = keys[i];
            found[key] = record[key];
          }
          return found;
        }
      });
  }
  else {
    promise = Promise.resolve(record);
  }

  return promise
    .bind(this)
    .then(function (record) {
      data.record = record;
      return this.send('record-update', data)
        .then(function (results) {
          record['@version'] = (results ? results.version : 0) || 0;
          return record;
        });
    });
};

/**
 * Delete the given record.
 *
 * @param   {String|RID|Object} record  The record or record id to delete.
 * @param   {Object}            options The query options.
 * @promise {Object}                    The deleted record object.
 */
exports.delete = function (record, options) {
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

  return this.send('record-delete', {
      cluster: rid.cluster,
      position: rid.position,
      version: record['@version'] != null ? +record['@version'] : -1,
      mode: options.mode || 0
    })
    .then(function (response) {
      return record;
    });
};

/**
 * Extract the record id and record from the given argument.
 *
 * @param  {String|RID|Object} record The record.
 * @return {[RID, Object]}            The record id and object.
 */
function extractRecordId(record) {
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
