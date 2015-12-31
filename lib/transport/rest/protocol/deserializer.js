"use strict";

var RecordID = require('../../../recordid'),
    errors = require('../../../errors'),
    Long = require('../../../long').Long;


/**
 * Deserialize a given serialized document.
 *
 * @param  {String}  serialized The serialized document.
 * @return {Object}             The deserialized document
 */
function deserializeDocument (serialized) {
  try {
    var jsonParse = require('./json_parse');

    var res = jsonParse(serialized, function (key, value) {
      if (key === '@rid') {
        return new RecordID(value);
      }
      if (value !== null && (typeof value === 'object')) {
        applyFieldTypes(value);
      }
      return value;
    }, {
      numberParser: function (number) {
        var result = +number;
        if (result.toString() !== number) {
          return Long.fromString(number);
        }
        return result;
      }
    });

    applyFieldTypes(res);

    return res;
  }
  catch (e) {
    throw new errors.Request(serialized);
  }
}

function applyFieldTypes(value) {
  var fieldTypes = value['@fieldTypes'];
  if (!fieldTypes) {
    return value;
  }
  fieldTypes.split(',').forEach(function (item) {
    var parts = item.split('=');
    value[parts[0]] = applyFieldType(parts[1], value[parts[0]]);
  });
  return value;
}

function applyFieldType (type, value) {
  switch (type) {
    case 'a': // date
    case 't': // datetime
      return new Date(value);
    case 'e': // set
    case 'c': // decimal
    case 'd': // double
    case 'b': // byte
    case 's': // short
    case 'f': // float
      return value;
    case 'l': // long
      if (value instanceof Long) {
        return value;
      }
      return Long.fromNumber(value);
    default:
      return value;
  }
}

// export the public methods

exports.deserializeDocument = deserializeDocument;
