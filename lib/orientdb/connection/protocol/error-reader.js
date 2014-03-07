var constants = require('./constants'),
    reader = require('./reader');


/**
 * Check whether an error can be read from the given buffer.
 *
 * @param  {Buffer} buf     The buffer to check.
 * @param  {Integer} offset The offset to start from.
 * @return {Boolean}        true if an error can be read.
 */
function canReadError (buf, offset) {
  if (!reader.canReadByte(buf, offset)) {
    return false;
  }
  var more = reader.readByte(buf, offset),
      result;
  offset += constants.BYTES_BYTE;
  while (more) {
    if (!reader.canReadString(buf, offset)) {
      return false;
    }
    result = reader.readString(buf, offset);
    offset += constants.BYTES_INT + result.lengthInBytes;

    if (!reader.canReadString(buf, offset)) {
      return false;
    }
    result = reader.readString(buf, offset);
    offset += constants.BYTES_INT + result.lengthInBytes;

    if (!reader.canReadByte(buf, offset)) {
      return false;
    }
    more = reader.readByte(buf, offset);
    offset += constants.BYTES_BYTE;
  }
  return true;
};

/**
 * Read an error from the buffer at the given offset.
 *
 * @fixme see if we can make `objOffset` an integer for consistency with other methods
 *
 * @param  {Buffer} buf       The buffer to read from.
 * @param  {Object} objOffset The object containing the offset to start reading at.
 * @return {Array}            The error objects.
 */
function readError (buf, objOffset) {
  var offset = objOffset.offset,
      errors = [],
      more = reader.readByte(buf, offset),
      error, errorClass, errorMessage;

  offset += constants.BYTES_BYTE;

  while (more) {
    error = {};

    // exception class
    errorClass = reader.readString(buf, offset);
    error.class = errorClass.value;
    offset += constants.BYTES_INT + errorClass.lengthInBytes;

    // exception message
    errorMessage = reader.readString(buf, offset);
    error.message = errorMessage.value;
    offset += constants.BYTES_INT + errorMessage.lengthInBytes;

    // add to results
    errors.push(error);

    more = reader.readByte(buf, offset);
    offset += constants.BYTES_BYTE;
  }

  // save the end offset if we were passed the initial offset in an object
  objOffset.offset = offset;

  return errors;
};

exports.canReadError = canReadError;
exports.readError = readError;