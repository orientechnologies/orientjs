"use strict";

/**
 * # Record ID
 *
 * Represents a Record ID in a document.
 * Used to differentiate between actual record ids and strings that merely look like them.
 * Without this, it is impossible to differentiate between `'#1:12'` the string and `#1:12` the record id.
 *
 * @param {String|Array|Object} input The input to parse.
 *
 * @example convert a string to a RecordID instance
 *
 *    var rid = RecordID('#1:1');
 *    console.log(rid); // => {cluster: 1, position: 1}
 *    console.log('ID:' + rid); // => "ID:#1:1"
 *
 * @example convert an array of strings to an an array of record ids
 *
 *    var rids = RecordID(['#1:1', '#1:2', '#1:3']);
 *    console.log(rids); // => [{cluster: 1, position: 1}, {cluster: 1, position: 2, {cluster: 1, position: 3}]
 *    console.log(rids.join(', ')); // "#1:1, #1:2, #1:3"
 *
 * @example check that a RID is valid
 *
 *    RecordID.isValid('#1:12'); // => true
 *    RecordID.isValid('not a record id'); // => false
 *
 */
function RecordID (input) {
  if (!(this instanceof RecordID)) {
    return new RecordID(input);
  }

  this.cluster = null;
  this.position = null;

  if (input) {
    if (typeof input === 'string') {
      var parsed = RecordID.parse(input);
      if (parsed) {
        return parsed;
      }
    }
    else if (Array.isArray(input)) {
      return input.map(function (item) {
        return new RecordID(item);
      });
    }
    else if (typeof input === 'object') {
      if (input.cluster == +input.cluster) {
        this.cluster = +input.cluster;
      }
      if (input.position == +input.position) {
        this.position = +input.position;
      }
    }
  }
}

/**
 * Convert the record id back into a string when being compared or serialized.
 * @return {String} The string representation of the Record ID
 */
RecordID.prototype.valueOf = RecordID.prototype.toString = RecordID.prototype.toJSON = function () {
  return '#' + this.cluster + ':' + this.position;
};

/**
 * Determine whether the record id is valid.
 * @return {Boolean} true if the record id is valid.
 */
RecordID.prototype.isValid = function () {
  return this.cluster == +this.cluster && this.position == +this.position;
};


/**
 * Parse a record id into a RecordID object.
 *
 * @param  {String|Array|Object}          input The input to parse.
 * @return {RecordID|RecordID[]|Boolean}        The parsed RecordID instance(s)
 *                                              or false if the record id could not be parsed
 */
RecordID.parse = function (input) {
  if (input && typeof input === 'object') {
    if (Array.isArray(input)) {
      return input.map(RecordID.parse)
      .filter(function (item) {
        return item;
      });
    }
    else if (input.cluster != null && input.position != null) {
      return new RecordID(input);
    }
    else {
      return false;
    }
  }
  var matches = /^#(-?\d+):(-?\d+)$/.exec(input);
  if (!matches) {
    return false;
  }
  else {
    return new RecordID({
      cluster: +matches[1],
      position: +matches[2]
    });
  }
};

/**
 * Determine whether the given input is a valid record id.
 * @param  {String|Array|Object|RecordID}  input The record id to check.
 * @return {Boolean}
 */
RecordID.isValid = function (input) {
  var i, total;
  if (input instanceof RecordID) {
    return input.isValid();
  }
  else if (typeof input === 'string') {
    return /^#(-?\d+):(-?\d+)$/.test(input);
  }
  else if (input && Array.isArray(input)) {
    total = input.length;
    for (i = 0; i < total; i++) {
      if (!RecordID.isValid(input[i])) {
        return false;
      }
    }
    return i ? true : false;
  }
  else if (input && typeof input === 'object') {
    return input.cluster == +input.cluster && input.position == +input.position;
  }
  else {
    return false;
  }
};

/**
 * Return a record id for a given cluster and position.
 *
 * @param  {Integer} cluster  The cluster ID.
 * @param  {Integer} position The position.
 * @return {String}           The record id.
 */
RecordID.toRid = function (cluster, position) {
  return "#" + cluster + ":" + position;
};

module.exports = RecordID;