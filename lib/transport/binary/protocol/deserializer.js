"use strict";

var RID = require('../../../recordid'),
    Bag = require('../../../bag');

/**
 * Deserialize the given record and return an object containing the values.
 *
 * @param  {String} input The serialized record.
 * @return {Object}       The deserialized record.
 */
function deserialize (input) {
  var record = {'@type': 'd'},
      chunk, key, value;
  if (!input) {
    return null;
  }
  chunk = eatFirstKey(input);
  if (chunk[2]) {
    // this is actually a class name
    record['@class'] = chunk[0];
    input = chunk[1];
    chunk = eatKey(input);
    key = chunk[0];
    input = chunk[1];
  }
  else {
    key = chunk[0];
    input = chunk[1];
  }

  // read the first value.
  chunk = eatValue(input);
  value = chunk[0];
  input = chunk[1];
  record[key] = value;

  while (input.length) {
    if (input.charAt(0) === ',') {
      input = input.slice(1);
    }
    else {
      break;
    }
    chunk = eatKey(input);
    key = chunk[0];
    input = chunk[1];
    if (input.length) {
      chunk = eatValue(input);
      value = chunk[0];
      input = chunk[1];
      record[key] = value;
    }
    else {
      record[key] = null;
    }
  }

  return record;
}

/**
 * Consume the first field key, which could be a class name.
 *
 * @param  {String}           input The input to parse.
 * @return {[String, String]}       The collected key, and any remaining input.
 */
function eatFirstKey (input) {
  var length = input.length,
      collected = '',
      isClassName = false,
      result, c, i;

  if (input.charAt(0) === '"') {
    result = eatString(input.slice(1));
    return [result[0], result[1].slice(1)];
  }

  for (i = 0; i < length; i++) {
    c = input.charAt(i);
    if (c === '@') {
      isClassName = true;
      break;
    }
    else if (c === ':') {
      break;
    }
    else {
      collected += c;
    }
  }

  return [collected, input.slice(i + 1), isClassName];
}


/**
 * Consume a field key, which may or may not be quoted.
 *
 * @param  {String}           input The input to parse.
 * @return {[String, String]}       The collected key, and any remaining input.
 */
function eatKey (input) {
  var length = input.length,
      collected = '',
      result, c, i;

  if (input.charAt(0) === '"') {
    result = eatString(input.slice(1));
    return [result[0], result[1].slice(1)];
  }

  for (i = 0; i < length; i++) {
    c = input.charAt(i);
    if (c === ':') {
      break;
    }
    else {
      collected += c;
    }
  }

  return [collected, input.slice(i + 1)];
}



/**
 * Consume a field value.
 *
 * @param  {String}           input The input to parse.
 * @return {[Mixed, String]}        The collected value, and any remaining input.
 */
function eatValue (input) {
  var c, n;
  c = input.charAt(0);
  while (c === ' ' && input.length) {
    input = input.slice(1);
    c = input.charAt(0);
  }

  if (!input.length || c === ',') {
    // this is a null field.
    return [null, input];
  }
  else if (c === '"') {
    return eatString(input.slice(1));
  }
  else if (c === '#') {
    return eatRID(input.slice(1));
  }
  else if (c === '[') {
    return eatArray(input.slice(1));
  }
  else if (c === '<') {
    return eatSet(input.slice(1));
  }
  else if (c === '{') {
    return eatMap(input.slice(1));
  }
  else if (c === '(') {
    return eatRecord(input.slice(1));
  }
  else if (c === '%') {
    return eatBag(input.slice(1));
  }
  else if (c === '_') {
    return eatBinary(input.slice(1));
  }
  else if (c === '-' || c === '0' || +c) {
    return eatNumber(input);
  }
  else if (c === 'n' && input.slice(0, 4) === 'null') {
    return [null, input.slice(4)];
  }
  else if (c === 't' && input.slice(0, 4) === 'true') {
    return [true, input.slice(4)];
  }
  else if (c === 'f' && input.slice(0, 5) === 'false') {
    return [false, input.slice(5)];
  }
  else {
    return [null, input];
  }
}

/**
 * Consume a string
 *
 * @param  {String}           input The input to parse.
 * @return {[String, String]}       The collected string, and any remaining input.
 */
function eatString (input) {
  var length = input.length,
      collected = '',
      c, i;

  for (i = 0; i < length; i++) {
    c = input.charAt(i);
    if (c === '\\') {
      // escape, skip to the next character
      i++;
      collected += input.charAt(i);
      continue;
    }
    else if (c === '"') {
      break;
    }
    else {
      collected += c;
    }
  }

  return [collected, input.slice(i + 1)];
}

/**
 * Consume a number.
 *
 * If the number has a suffix, consume it also and instantiate the right type, e.g. for dates
 *
 * @param  {String}           input The input to parse.
 * @return {[Mixed, String]}        The collected number, and any remaining input.
 */
function eatNumber (input) {
  var length = input.length,
      collected = '',
      c, i;

  for (i = 0; i < length; i++) {
    c = input.charAt(i);
    if (c === '-' || c === '.' || c === '0' || +c) {
      collected += c;
    }
    else {
      break;
    }
  }

  collected = +collected;
  input = input.slice(i);

  c = input.charAt(0);

  if (c === 'a' || c === 't') {
    collected = new Date(collected);
    input = input.slice(1);
  }
  else if (c === 'b' || c === 's' || c === 'l' || c === 'f' || c == 'd' || c === 'c') {
    input = input.slice(1);
  }

  return [collected, input];
}

/**
 * Consume a Record ID.
 *
 * @param  {String}           input The input to parse.
 * @return {[RID, String]}          The collected record id, and any remaining input.
 */
function eatRID (input) {
  var length = input.length,
      collected = '',
      cluster, c, i;

  for (i = 0; i < length; i++) {
    c = input.charAt(i);
    if (cluster === undefined && c === ':') {
      cluster = +collected;
      collected = '';
    }
    else if (c === '0' || +c) {
      collected += c;
    }
    else {
      break;
    }
  }

  return [new RID({cluster: cluster, position: +collected}), input.slice(i)];
}


/**
 * Consume an array.
 *
 * @param  {String}           input   The input to parse.
 * @return {[Array, String]}          The collected array, and any remaining input.
 */
function eatArray (input) {
  var length = input.length,
      array = [],
      chunk, c;

  while (input.length) {
    c = input.charAt(0);
    if (c === ',') {
      input = input.slice(1);
    }
    else if (c === ']') {
      input = input.slice(1);
      break;
    }
    chunk = eatValue(input);
    array.push(chunk[0]);
    input = chunk[1];
  }
  return [array, input];
}


/**
 * Consume a set.
 *
 * @param  {String}           input   The input to parse.
 * @return {[Array, String]}          The collected set, and any remaining input.
 */
function eatSet (input) {
  var length = input.length,
      set = [],
      chunk, c;

  while (input.length) {
    c = input.charAt(0);
    if (c === ',') {
      input = input.slice(1);
    }
    else if (c === '>') {
      input = input.slice(1);
      break;
    }
    chunk = eatValue(input);
    set.push(chunk[0]);
    input = chunk[1];
  }

  return [set, input];
}

/**
 * Consume a map (object).
 *
 * @param  {String}           input   The input to parse.
 * @return {[Object, String]}         The collected map, and any remaining input.
 */
function eatMap (input) {
  var length = input.length,
      map = {},
      key, value, chunk, c;

  while (input.length) {
    c = input.charAt(0);
    if (c === ' ') {
      input = input.slice(1);
      continue;
    }
    if (c === ',') {
      input = input.slice(1);
    }
    else if (c === '}') {
      input = input.slice(1);
      break;
    }

    chunk = eatKey(input);
    key = chunk[0];
    input = chunk[1];
    if (input.length) {
      chunk = eatValue(input);
      value = chunk[0];
      input = chunk[1];
      map[key] = value;
    }
    else {
      map[key] = null;
    }
  }

  return [map, input];
}

/**
 * Consume an embedded record.
 *
 * @param  {String}           input   The input to parse.
 * @return {[Object, String]}         The collected record, and any remaining input.
 */
function eatRecord (input) {
  var record = {'@type': 'd'},
      chunk, c, key, value;

  while (input.length) {
    c = input.charAt(0);
    if (c === ' ') {
      input = input.slice(1);
      continue;
    }
    else if (c === ')') {
      // empty record.
      input = input.slice(1);
      return [record, input];
    }
    else {
      break;
    }
  }

  chunk = eatFirstKey(input);

  if (chunk[2]) {
    // this is actually a class name
    record['@class'] = chunk[0];
    input = chunk[1];
    chunk = eatKey(input);
    while (input.length) {
      c = input.charAt(0);
      if (c === ' ') {
        input = input.slice(1);
        continue;
      }
      else if (c === ')') {
        // empty record.
        input = input.slice(1);
        return [record, input];
      }
      else {
        break;
      }
    }
    key = chunk[0];
    input = chunk[1];
  }
  else {
    key = chunk[0];
    input = chunk[1];
  }

  // read the first value.
  chunk = eatValue(input);
  value = chunk[0];
  input = chunk[1];
  record[key] = value;

  while (input.length) {
    c = input.charAt(0);
    if (c === ' ') {
      input = input.slice(1);
      continue;
    }
    if (c === ',') {
      input = input.slice(1);
    }
    else if (c === ')') {
      input = input.slice(1);
      break;
    }
    chunk = eatKey(input);
    key = chunk[0];
    input = chunk[1];
    if (input.length) {
      chunk = eatValue(input);
      value = chunk[0];
      input = chunk[1];
      record[key] = value;
    }
    else {
      record[key] = null;
    }
  }

  return [record, input];
}

/**
 * Consume a RID Bag.
 *
 * @param  {String}            input   The input to parse.
 * @return {[Object, String]}          The collected bag, and any remaining input.
 */
function eatBag (input) {
  var length = input.length,
      collected = '',
      i, bag, chunk, c;

  for (i = 0; i < length; i++) {
    c = input.charAt(i);
    if (c === ';') {
      break;
    }
    else {
      collected += c;
    }
  }
  input = input.slice(i + 1);

  return [new Bag(collected), input];
}


/**
 * Consume a binary buffer.
 *
 * @param  {String}            input   The input to parse.
 * @return {[Object, String]}          The collected bag, and any remaining input.
 */
function eatBinary (input) {
  var length = input.length,
      collected = '',
      i, bag, chunk, c;

  for (i = 0; i < length; i++) {
    c = input.charAt(i);
    if (c === '_' || c === ',' || c === ')' || c === '>' || c === '}' || c === ']') {
      break;
    }
    else {
      collected += c;
    }
  }
  input = input.slice(i + 1);

  return [new Buffer(collected, 'base64'), input];
}



exports.deserialize = deserialize;
exports.eatKey = eatKey;
exports.eatValue = eatValue;
exports.eatString = eatString;
exports.eatNumber = eatNumber;
exports.eatRID = eatRID;
exports.eatArray = eatArray;
exports.eatSet = eatSet;
exports.eatMap = eatMap;
exports.eatRecord = eatRecord;
exports.eatBag = eatBag;
exports.eatBinary = eatBinary;