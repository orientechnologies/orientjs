var constants = require('./constants'),
    reader = require('./reader'),
    RecordID = require('../../recordid'),
    errors = require('../../errors');


/**
 * Read a record from the buffer at the given offset.
 *
 * @fixme see if we can make `objOffset` an integer for consistency with other methods
 *
 * @param  {Buffer} buf       The buffer to read from.
 * @param  {Object} objOffset The object containing the offset.
 * @return {Object}           The raw record object.
 */
function readRecord (buf, objOffset) {
  var offset = objOffset.offset,
      record = {},
      clusterId,
      clusterPosition,
      readStringContent;

  if (!reader.canReadShort(buf, offset)) {
    return;
  }
  record["class"] = reader.readShort(buf, offset);

  offset += constants.BYTES_SHORT;

  if (record["class"] === -2) {
    // no record
    record = null;
  }
  else if (record["class"] === -3) {
    record.type = "d";
    // cluster ID
    if (!reader.canReadShort(buf, offset)) {
      return;
    }
    clusterId = reader.readShort(buf, offset);
    offset += constants.BYTES_SHORT;

    // cluster position
    if (!reader.canReadLong(buf, offset)) {
      return;
    }
    clusterPosition = reader.readLong(buf, offset);
    offset += constants.BYTES_LONG;

    record.rid = RecordID.toRid(clusterId, clusterPosition);
  }
  else if (record["class"] === -1) {
    // @todo handle this edge case better
    throw new errors.Protocol("No class for record, cannot proceed.");
  }
  else if (record["class"] > -1) {
    // valid

    // record type ('d' or 'b')
    if (!reader.canReadByte(buf, offset)) {
      return;
    }
    record.type = String.fromCharCode(reader.readByte(buf, offset));
    offset += constants.BYTES_BYTE;

    // cluster ID
    if (!reader.canReadShort(buf, offset)) {
      return;
    }
    clusterId = reader.readShort(buf, offset);
    offset += constants.BYTES_SHORT;

    if (clusterId !== -1) {
      // cluster position
      if (!reader.canReadLong(buf, offset)) {
        return;
      }
      clusterPosition = reader.readLong(buf, offset);
      offset += constants.BYTES_LONG;

      record.rid = RecordID.toRid(clusterId, clusterPosition);
    }
    else {
      // jump over the cluster position
      offset += constants.BYTES_LONG;
    }

    // record version
    if (!reader.canReadInt(buf, offset)) {
      return;
    }
    record.version = reader.readInt(buf, offset);
    offset += constants.BYTES_INT;

    // serialized record
    if (!reader.canReadString(buf, offset)) {
      return;
    }
    readStringContent = reader.readString(buf, offset);
    record.content = readStringContent.value;
    offset += constants.BYTES_INT + readStringContent.lengthInBytes;
  }
  else {
      throw new errors.Protocol("Unknown record class id: " + record["class"]);
  }

  // save the end offset if we were passed the initial offset in an object
  objOffset.offset = offset;

  return record;
};

exports.readRecord = readRecord;