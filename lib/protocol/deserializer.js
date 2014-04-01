var RecordID = require('../recordid'),
    Long = require('./long').Long


/**
 * A map of start delimiters to their end delimiters.
 * @type {Object}
 */
var START_DELIMITERS = {
  '[': ']',
  '{': '}',
  '(': ')',
  '<': '>'
};

/**
 * A map of end delimiters to their start delimiters.
 * @type {Object}
 */
var END_DELIMITERS = {
  ']': '[',
  '}': '{',
  ')': '(',
  '>': '<'
}

/**
 * Deserialize a given serialized document.
 *
 * @param  {String}  serialized The serialized document.
 * @param  {Object}  document   The optional document to apply the unserialized values to.
 * @param  {Boolean} isMap      If this is a map of values
 * @return {Object}             The deserialized document
 */
function deserializeDocument (serialized, document, isMap) {
  if (serialized == null) return serialized;
  serialized  = serialized.trim();
  document  = document || {};

  var classIndex    = serialized.indexOf("@"),
      indexOfColon  = serialized.indexOf(":"),
      fieldIndex, field, commaIndex, value;

  if (~classIndex && (indexOfColon > classIndex || !~indexOfColon)) {
    document['@class'] = serialized.substr(0, classIndex);
    serialized = serialized.substr(classIndex + 1);
  }

  if (!isMap) {
    document['@type'] = 'd';
  }

  var fieldIndex;

  while (~(fieldIndex = serialized.indexOf(':'))) {
    field = serialized.substr(0, fieldIndex);
    serialized = serialized.substr(fieldIndex + 1);
    if (field.charAt(0) === "\"" && field[field.length - 1] === "\"") {
      field = field.substring(1, field.length - 1);
    }
    commaIndex = findCommaIndex(serialized);
    value = serialized.substr(0, commaIndex);
    serialized = serialized.substr(commaIndex + 1);
    value = deserializeValue(value);
    if (field.slice(0, 4) === 'out_' && value && value[0] === '%' && value[value.length - 1] === ';') {
      value = deserializeBag(value);
    }
    document[field] = value;
  }

  return document;
};

/**
 * Deserialize a bag of values.
 *
 * @param  {String}     value  The serialized bag.
 * @return {RecordID[]}        The unserialized bag.
 */
function deserializeBag (value) {
  var buffer = new Buffer(value.slice(1,-1), 'base64'),
      offset = 0,
      status = buffer.readUInt8(offset++),
      total = buffer.readUInt32BE(offset),
      content = [],
      i, cluster, position;

  offset += 4;
  for (i = 0; i < total; i++) {
    cluster = buffer.readInt16BE(offset);
    offset += 2;
    position = Long.fromBits(buffer.readUInt32BE(offset + 4), buffer.readInt32BE(offset)).toNumber();
    offset += 8;
    content.push(new RecordID({
      cluster: cluster,
      position: position
    }));
  }
  return content;
}

/**
 * Deserialize a given value into the right type.
 *
 * @param  {String} value The serialized value to unserialize.
 * @return {Mixed}        The deserialized value.
 */
function deserializeValue (value) {
  value = (''+value).trim();
  if(value === '') {
    return null;
  }

  if (value === 'true' || value === 'false') {
    return value === 'true';
  }

  var firstChar = value.charAt(0),
      lastChar = value[value.length - 1],
      values;

  if ("\"" === firstChar) {
    // string
    return value.substr(1, value.length - 2).replace(/\\"/g, "\"").replace(/\\\\/, "\\");
  }
  else if ('t' === lastChar || 'a' === lastChar) {
    // date
    return new Date(parseInt(value.substr(0, value.length - 1)));
  }
  else if ('(' === firstChar) {
    // object / document
    return deserializeDocument(value.substr(1, value.length - 2));
  }
  if ('{' === firstChar) {
    // map
    return deserializeDocument(value.substr(1, value.length - 2), {}, true);
  }
  else if ('[' === firstChar || '<' === firstChar) {
    //process Set <...> like List [...]
    values = splitList(value.substr(1, value.length - 2));
    for (var i = 0, length = values.length; i < length; i++) {
      values[i] = deserializeValue(values[i]);
    }
    return values;
  }
  else if ('b' === lastChar) {
    // byte
    return String.fromCharCode(parseInt(value.substr(0, value.length - 1)));
  }
  else if ('l' === lastChar || 's' === lastChar || 'c' === lastChar) {
    // integer
    return parseInt(value.substr(0, value.length - 1), 10);
  }
  else if ('f' === lastChar || 'd' === lastChar) {
    // float / decimal
    return parseFloat(value.substr(0, value.length - 1));
  }
  else if (+value == value) {
    // integer
    return +value;
  }
  else if (value && (rid = RecordID.parse(value))) {
    return rid;
  }
  else {
    return value;
  }
};


/**
 * Find the index of the first comma in the given serialized input,
 * disregarding values that appear within delimiters.
 *
 * @param  {String} serialized The serialized value to inspect.
 * @return {Integer}           The index of the first comma.
 */
function findCommaIndex (serialized) {
  var delimiters = [],
      current, prev, i, length;
  for (i = 0, length = serialized.length; i < length; i++) {
    current = serialized[i];
    prev = delimiters[delimiters.length - 1];
    if (current === "," && delimiters.length === 0) {
      return i;
    }
    else if (START_DELIMITERS[current] && prev !== "\"") {
      delimiters.push(current);
    }
    else if (END_DELIMITERS[current] && prev !== "\"" && (current === START_DELIMITERS[prev] || current === '"')) {
      delimiters.pop();
    }
    else if (current === "\"" && prev === "\"" && i > 0 && serialized[i - 1] !== "\\") {
      delimiters.pop();
    }
    else if (current === "\"" && prev !== "\"") {
      delimiters.push(current);
    }
  }
  return serialized.length;
}

/**
 * Split a serialized list into items that can then be parsed individually.
 * @param  {String} value  The list value to split.
 * @return {String[]}      The split items, ready to be parsed
 */
function splitList (value) {
  var result = [],
      commaAt;
  while (value.length) {
    commaAt = findCommaIndex(value);
    result.push(value.substr(0, commaAt));
    value = value.substr(commaAt + 1);
  }
  return result;
}


// export the public methods


exports.deserializeValue = deserializeValue;
exports.deserializeDocument = deserializeDocument;