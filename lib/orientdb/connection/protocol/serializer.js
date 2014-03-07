var RecordID = require('../../recordid'),
    _ = require('lodash');

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
    if (field === '@version' || field === '@rid' || field === '@type' || field === '@options') {
      continue;
    }
    else if (field === '@class') {
      className = value;
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
};

/**
 * Serialize a given value according to its type.
 * @param  {Object} value The value to serialize.
 * @return {String}       The serialized value.
 */
function serializeValue (value) {
  if (isMD5(value)) {
    return '\"\"' + value.replace(/\\/, "\\\\").replace(/"/g, "\\\"") + "\"\"";
  }
  else if (_.isString(value)) {
    return '\"' + value.replace(/\\/, "\\\\").replace(/"/g, "\\\"") + "\"";
  }
  else if (_.isNumber(value)) {
    return ~value.toString().indexOf('.') ? value + 'f' : value;
  }
  else if (_.isBoolean(value)) {
    return value ? true : false;
  }
  else if (_.isDate(value)) {
    return value.getTime() + 't';
  }
  else if (_.isArray(value)) {
    return serializeArray(value);
  }
  else if (_.isObject(value)) {
    return serializeObject(value);
  }
  else
    return '';
};


/**
 * Serialize an array of values.
 * @param  {Array} value The value to serialize.
 * @return {String}      The serialized value.
 */
function serializeArray (value) {
  var result = '[', i, limit;
  for (i = 0, limit = value.length; i < limit; i++) {
    if (_.isObject(value[i])) {
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
  if (value instanceof RecordID)
    return value.toString();
  else if (value['@type'] === 'd')
    return '(' + serializeDocument(value, false) + ')';
  else
    return '{' + serializeDocument(value, true) + '}';
};



/**
 * Determine whether the given value is a valid MD5 hash.
 * @param  {String}  value The value to check
 * @return {Boolean}       true if the value is a valid md5, otherwise false.
 */
function isMD5 (value) {
  return /^[0-9a-f]{32}$/i.test(value);
}


/**
 * Turn a given object into an SQL SET expression.
 * @param  {Object} vertex The object to convert.
 * @return {Object}        The object containing the `sqlsets` and `remaining` items.
 */
function hashToSQLSets (vertex) {
  if (_.isEmpty(vertex)) {
    return {
      sqlsets: '',
      remaining: {}
    };
  }

  var remaining = {},
      sql = 'SET ',
      fieldNames = Object.keys(vertex),
      totalFields = fieldNames.length,
      field, value, i;

  for (i = 0; i < totalFields; i++) {
    field = fieldNames[i];
    value = vertex[field];
    if (field === "@version" || field === "@rid" || field === "@type" || field === "@class" || field === "@options") {
      continue;
    }
    if (_.isBoolean(value) || _.isNumber(value) || _.isString(value) || _.isDate(value)) {
      if (''+value === value) {
        value = "\"" + value.replace(/"/g, "\\\"") + "\"";
      }
      else if (_.isDate(value)) {
        value = "date(\"" + value.toISOString() + "\", \"yyyy-MM-dd'T'HH:mm:ss.SSS'Z'\")";
      }

      sql += field + ' = ' + value + ', ';
    }
    else {
      remaining[field] = value;
    }
  }

  // If nothing was added to the SET return empty string otherwise remove the last comma
  sql = sql === 'SET ' ? '' : sql.substring(0, sql.length - 2);

  return {
    sqlsets: sql,
    remaining: remaining
  };
};


// export the public methods

exports.serializeDocument = serializeDocument;
exports.serializeValue = serializeValue;
exports.encodeRecordData = encodeRecordData;
exports.hashToSQLSets = hashToSQLSets;