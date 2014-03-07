// the methods in this file exist to keep backwards compatability with
// previous versions of the library, their use is discouraged.


var _ = require('lodash'),
    RecordID = require('../../recordid');

/**
 * Check whether a value is null or undefined
 * @param  {Mixed}  value  The value to check.
 * @return {Boolean}       true if the value is null or undefined
 */
function isNullOrUndefined (value) {
  return value == null;
}

/**
 * Push a list of items into an array.
 *
 * @param  {Array} targetArray The array to push the items into.
 * @param  {Array} dataArray   The items to push.
 */
function pushArray (targetArray, dataArray) {
  targetArray.push.apply(targetArray, dataArray);
}

/**
 * Converts a string to a buffer without the length.
 * @param  {String} data The data to add to the buffer.
 * @return {Buffer}      The buffer containing the data.
 */
function stringToBuffer (data) {
  return new Buffer(data);
}

/**
 * Deep clone an object.
 *
 * @param  {Mixed} obj The value to clone.
 * @return {Mixed}     The cloned value.
 */
function deepClone (obj) {
  var fieldNames, field, totalFields, i, newObj;

  if (_.isFunction(obj) || _.isRegExp(obj)) {
    return obj;
  }
  else if (_.isDate(obj)) {
    return new Date(obj);
  }
  else if (_.isObject(obj)) {
    newObj = _.clone(obj);
    fieldNames = Object.keys(newObj);
    totalFields = fieldNames.length;
    for (i = 0; i < totalFields; i++) {
      field = fieldNames[i];
      newObj[field] = deepClone(newObj[field]);
    }
    return newObj;
  }
  else
    return obj;
}

/**
 * Parse a record id into an object.
 *
 * > Note: this is **not** the same as `RecordID.parse()`
 *
 * @param  {String|Object} rid The object or string to parse.
 * @return {Object}            The rid object, not a RecordID instance!
 */
function parseRid (rid) {
  var parsed;
  if (rid && rid['@rid'])
    rid = rid['@rid'];
  parsed = RecordID.parse(rid);
  if (!parsed)
    return {};
  return {
    clusterId: +parsed.cluster,
    clusterPosition: +parsed.position,
    recordId: parsed.toString()
  }
}

exports.toRid = RecordID.toRid;
exports.isNullOrUndefined = isNullOrUndefined;
exports.pushArray = pushArray;
exports.stringToBuffer = stringToBuffer;
exports.deepClone = deepClone;
exports.parseRid = parseRid;