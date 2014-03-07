var Long = require('../long').Long,
    constants = require('./constants');

/**
 * Read a byte as unsigned integer from the buffer at the given offset.
 *
 * @param  {Buffer} buf      The buffer to read from
 * @param  {Integer} offset  The offset to start reading at
 * @return {UInt8}           The byte
 */
function readByte (buf, offset) {
  if (offset + constants.BYTES_BYTE > buf.length) {
    throw new Error(1);
  }

  return buf.readUInt8(offset);
}

/**
 * Check whether a byte can be read from the buffer.
 *
 * @param  {Buffer} buf      The buffer to check.
 * @param  {Integer} offset  The offset to start at
 * @return {Boolean}         true if a byte can be read.
 */
function canReadByte (buf, offset) {
  return offset + constants.BYTES_BYTE <= buf.length;
}

/**
 * Read bytes from the buffer at the given offset.
 *
 * @param  {Buffer} buf     The buffer to read bytes from.
 * @param  {Integer} offset The offset to start reading at.
 * @return {Buffer}         The buffer containing the bytes read.
 */
function readBytes (buf, offset) {
  var length = readInt(buf, offset),
      newOffset = offset + constants.BYTES_INT,
      bytes = new Buffer(length);

  if (newOffset + length > buf.length) {
    throw new Error((newOffset + length) + " > " + buf.length);
  }

  buf.copy(bytes, 0, newOffset, length + newOffset);
  return bytes;
}


/**
 * Check whether bytes can be read from the given buffer.
 *
 * @param  {Buffer} buf     The buffer to check.
 * @param  {Integer} offset The offset to start from.
 * @return {Boolean}        true if bytes can be read.
 */
function canReadBytes (buf, offset) {
  if (!canReadInt(buf, offset)) {
    return false;
  }
  return (offset + constants.BYTES_INT + readInt(buf, offset)) <= buf.length;
}

/**
 * Read a 2-byte signed integer from the buffer at the given offset.
 *
 * @param  {Buffer} buf     The buffer to read from.
 * @param  {Integer} offset The offset to start reading at.
 * @return {Int16}          The 2 byte signed integer.
 */
function readShort (buf, offset) {
  if(offset + constants.BYTES_SHORT > buf.length) {
    throw new Error(1);
  }

  return buf.readInt16BE(offset);
}

/**
 * Check whether a 2-byte signed integer can be read from the given buffer.
 *
 * @param  {Buffer} buf     The buffer to check.
 * @param  {Integer} offset The offset to start from.
 * @return {Boolean}        true if bytes can be read.
 */
function canReadShort (buf, offset) {
  return offset + constants.BYTES_SHORT <= buf.length;
}

 /**
 * Read a 4-byte signed integer from the buffer at the given offset.
 *
 * @param  {Buffer} buf     The buffer to read from.
 * @param  {Integer} offset The offset to start reading at.
 * @return {Int16}          The 4 byte signed integer.
 */
function readInt (buf, offset) {
  if (offset + constants.BYTES_INT > buf.length) {
    throw new Error(1);
  }

  return buf.readInt32BE(offset);
}

/**
 * Check whether a 4-byte signed integer can be read from the given buffer.
 *
 * @param  {Buffer} buf     The buffer to check.
 * @param  {Integer} offset The offset to start from.
 * @return {Boolean}        true if bytes can be read.
 */
function canReadInt (buf, offset) {
  return offset + constants.BYTES_INT <= buf.length;
}

 /**
 * Read an 8-byte signed integer from the buffer at the given offset.
 *
 * @param  {Buffer} buf     The buffer to read from.
 * @param  {Integer} offset The offset to start reading at.
 * @return {Int16}          The 8 byte signed integer.
 */
function readLong (buf, offset) {
  if (offset + constants.BYTES_LONG > buf.length) {
    throw new Error(1);
  }

  return Long.fromBits(buf.readUInt32BE(offset + constants.BYTES_INT), buf.readInt32BE(offset)).toNumber();
}

/**
 * Check whether an 8-byte signed integer can be read from the given buffer.
 *
 * @param  {Buffer} buf     The buffer to check.
 * @param  {Integer} offset The offset to start from.
 * @return {Boolean}        true if bytes can be read.
 */
function canReadLong (buf, offset) {
  return offset + constants.BYTES_LONG <= buf.length;
}

/**
 * Read a string from the buffer at the given offset.
 *
 * > WARNING: This will succeed even if the buffer does not contain the whole string!
 *
 * @param  {Buffer} buf     The buffer to read from.
 * @param  {Integer} offset The offset to start reading at.
 * @return {Object}         An object with two properties:
 *                         `value` - the string
 *                         `lengthInBytes` - the length of the string in bytes
 */
function readString (buf, offset) {
  var length = readInt(buf, offset),
      result = {};

  if (offset + constants.BYTES_INT + length > buf.length) {
    throw new Error(1);
  }

  offset += constants.BYTES_INT;
  result.lengthInBytes = length;

  if (length > 0) {
    result.value = buf.toString("utf8", offset, offset + length);
  }
  else {
    result.value = "";
    result.lengthInBytes = 0;
  }
  return result;
}

/**
 * Check whether a string can be read from the given buffer.
 *
 * @param  {Buffer} buf     The buffer to check.
 * @param  {Integer} offset The offset to start from.
 * @return {Boolean}        true if a string can be read.
 */
function canReadString (buf, offset) {
  if (!canReadInt(buf, offset)) {
    return false;
  }
  return offset + constants.BYTES_INT + readInt(buf, offset) <= buf.length;
}



exports.readByte = readByte;
exports.canReadByte = canReadByte;
exports.readBoolean = readByte;
exports.canReadBoolean = canReadByte;

exports.readBytes = readBytes;
exports.canReadBytes = canReadBytes;

exports.readShort = readShort;
exports.canReadShort = canReadShort;

exports.readInt = readInt;
exports.canReadInt = canReadInt;

exports.readLong = readLong;
exports.canReadLong = canReadLong;

exports.readString = readString;
exports.canReadString = canReadString;
