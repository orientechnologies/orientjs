/*jshint esversion: 6 */
"use strict";


const Record = require('../../../db/record');
const Promise = require('bluebird'),
  RID = require('../../../recordid'),
  errors = require('../../../errors');

module.exports = exports;


Object.keys(Record).forEach((k) => {
  exports[k] = Record[k];
});


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
  let className = record['@class'] || '',
    rid;

  options = options || {};
  if (record['@rid']) {
    return Promise.reject(new errors.Operation('Cannot create record - RecordID should be empty'));
  }
  if (className === '') {
    return Promise.reject(new errors.Operation('Cannot create record - Class is invalid.'));
  }
  return this.send('record-create', {
    segment: options.segment != null ? +options.segment : -1,
    type: record['@type'],
    record: record
  }).then(function (results) {
    record['@rid'] = new RID( { cluster : results.cluster, position : results.position});
    record['@version'] = results.version;
    return record;
  });


};

