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
    var json_parse = require('./json_parse');

    var res = json_parse(serialized, function (key, value) {
      if (key === '@rid') {
        return new RecordID(value);
      }
      if (value !== null && (typeof value === 'object')) {
        applyFieldTypes(value);
      }
      return value;
    }, {
      numberParser: function (number) {
        if (number.indexOf('.') === -1) {
          return Long.fromString(number);
        }
        return +number;
      }
    });

    applyFieldTypes(res);

    return res;
  }
  catch (e) {
    throw new errors.Request(serialized + " - " + e.stack);
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
      return value;
    case 's': //short
    case 'f': // float
    case 'l': // long
      return value; // already parsed
    default:
      return value;
  }
}

// export the public methods

exports.deserializeDocument = deserializeDocument;
