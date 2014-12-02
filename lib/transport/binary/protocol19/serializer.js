"use strict";

var RecordID = require('../../../recordid');

/**
 * Serialize a record and return it as a buffer.
 *
 * @param  {Object} content The record to serialize.
 * @return {Buffer}         The buffer containing the content.
 */
function encodeRecordData (content) {
  return new Buffer(serializeDocument(content), 'utf8');
}

/**
 * Serialize a document.
 *
 * @param  {Object}  document The document to serialize.
 * @param  {Boolean} isMap    Whether to serialize the document as a map.
 * @return {String}           The serialized document.
 */
function serializeDocument (document, isMap) {
  var result = '',
      className = '',
      fieldNames = Object.keys(document),
      totalFields = fieldNames.length,
      fieldWrap, value, field, i;

  for (i = 0; i < totalFields; i++) {
    field = fieldNames[i];
    value = document[field];
    if (field === '@class') {
      className = value;
    }
    else if (field.charAt(0) === '@') {
      continue;
    }
    else {
      if (isMap) {
        fieldWrap = '"';
      }
      else {
        fieldWrap = '';
      }
      result += fieldWrap + field + fieldWrap + ':' + serializeValue(value) + ',';
    }
  }

  if (className !== '') {
    result = className + '@' + result;
  }

  if (result[result.length - 1] === ',') {
    result = result.slice(0, -1);
  }

  return result;
}

/**
 * Serialize a given value according to its type.
 * @param  {Object} value The value to serialize.
 * @return {String}       The serialized value.
 */
function serializeValue (value) {
  var type = typeof value;
  if (type === 'string') {
    return '"' + value.replace(/\\/, "\\\\").replace(/"/g, '\\"') + '"';
  }
  else if (type === 'number') {
    return ~value.toString().indexOf('.') ? value + 'f' : value;
  }
  else if (type === 'boolean') {
    return value ? true : false;
  }
  else if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.getTime() + 't';
  }
  else if (Array.isArray(value)) {
    return serializeArray(value);
  }
  else if (value === Object(value)) {
    return serializeObject(value);
  }
  else {
    return '';
  }
}


/**
 * Serialize an array of values.
 * @param  {Array} value The value to serialize.
 * @return {String}      The serialized value.
 */
function serializeArray (value) {
  var result = '[', i, limit;
  for (i = 0, limit = value.length; i < limit; i++) {
    if (value[i] === Object(value[i])) {
      result += serializeObject(value[i]);
    }
    else {
      result += serializeValue(value[i]);
    }
    if (i < limit - 1) {
      result += ',';
    }
  }
  result += ']';
  return result;
}

/**
 * Serialize an object.
 * @param  {Object} value The value to serialize.
 * @return {String}       The serialized value.
 */
function serializeObject (value) {
  if (value instanceof RecordID) {
    return value.toString();
  }
  else if (value['@type'] === 'd') {
    return '(' + serializeDocument(value, false) + ')';
  }
  else {
    return '{' + serializeDocument(value, true) + '}';
  }
}




// export the public methods

exports.serializeDocument = serializeDocument;
exports.serializeValue = serializeValue;
exports.encodeRecordData = encodeRecordData;