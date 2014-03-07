var constants = require('./constants'),
    reader = require('./reader'),
    recordReader = require('./record-reader'),
    RecordID = require('../../recordid');

/**
 * Read a collection from the buffer.
 *
 * @fixme this is inconsistent with the other read methods as it takes an `info` object
 *        rather than an offset.
 *
 * @param  {Buffer} buf      The buffer to read from
 * @param  {Object} info     The info object containing a limit field
 * @return {Array|undefined} The array of records, or undefined if there was an error
 */
function readCollection (buf, info) {
  var offset = info.offset || 0,
      collection = [],
      limit = info.limit,
      recordOffset, i, record;

  if (!limit) {
    // collection size
    if (!reader.canReadInt(buf, offset)) {
      return;
    }
    limit = reader.readInt(buf, offset);
    offset += constants.BYTES_INT;
  }

  for (i = limit; i--;) {
    recordOffset = { offset: offset };

    record = recordReader.readRecord(buf, recordOffset);

    // null check is NOT missing
    if (record === undefined) {
      return;
    }

    // do not add null records
    if (record) {
      offset = recordOffset.offset;
      collection.push(record);
    }
  }

  // save the end offset if we were passed the initial offset in an object
  info.offset = offset;
  info.limit = limit;

  return collection;
}

exports.readCollection = readCollection;