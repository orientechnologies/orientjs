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
    var fieldTypes = prepareFieldTypes(serialized['@fieldTypes']) || {};
    return JSON.parse(serialized, function (key, value) {
      if (key === '@rid') {
        return new RecordID(value);
      } else {
        var fieldType = fieldTypes[key];
      	if (fieldType) {
      	  return applyFieldType(fieldType, value);
      	}

        return value;
      }
    });
  }
  catch (e) {
    throw new errors.Request(serialized);
  }
}

function prepareFieldTypes(fieldTypes) {
  if (!fieldTypes) {
    return;
  }
  return fieldTypes.split(',').reduce(function (memo, item) {
    var parts = item.split('=');
    memo[parts[0]] = parts[1];
    return memo;
  }, {});
}

function applyFieldType (type, value) {
  switch (type) {
    case 'f': // float
      return parseFloat(value);
    case 'l': // long
      return Long.fromString(value);
    case 's': //short
      return +value;
    case 'a': // date
    case 't': // datetime
      return new Date(value);
    case 'e': // set
    case 'c': // decimal
    case 'd': // double
    case 'b': // byte
      return value;
    default:
      return value;
  }
}

// export the public methods

exports.deserializeDocument = deserializeDocument;
