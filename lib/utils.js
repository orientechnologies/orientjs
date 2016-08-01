"use strict";

var RID = require('./recordid'),
  Bag = require('./bag');

var RawExpression;


/**
 * Make it easy to extend classes.
 *
 * @example extend a class
 *
 *    function Parent () {
 *
 *    }
 *
 *    Parent.extend = utils.extend;
 *
 *    var Child = Parent.extend({
 *      '@foo': 'bar',
 *      'greeting': 'hello world'
 *    });
 *
 *    Child.foo; // => 'bar'
 *
 *    var child = new Child();
 *    child.greeting; // => 'hello world'
 *
 * @param  {Object} source [description]
 * @return {Function}        [description]
 */
exports.extend = function (source) {
  var parent = this,
    child;

  if (source.hasOwnProperty('constructor')) {
    child = source.constructor;
  }
  else {
    child = function () {
      return parent.apply(this, arguments);
    };
  }

  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value: child
    }
  });

  var keys, key, i, limit;

  for (keys = Object.keys(parent), key = null, i = 0, limit = keys.length; i < limit; i++) {
    key = keys[i];
    if (key !== 'prototype') {
      child[key] = parent[key];
    }
  }

  for (keys = Object.keys(source), key = null, i = 0, limit = keys.length; i < limit; i++) {
    key = keys[i];
    if (key.charCodeAt(0) === 64) {
      // @
      child[key.slice(1)] = source[key];
    }
    else if (key !== 'constructor') {
      child.prototype[key] = source[key];
    }
  }

  child.__super__ = child;

  return child;
};

/**
 * Augment an object with properties from another object.
 * Any methods on the child object will be bound to the local this context.
 *
 * @param  {String} name  The name of the object to add.
 * @param  {Object} props The object containing the properties / methods.
 * @return {Object}       this
 */
exports.augment = function (name, props) {
  var keys = Object.keys(props),
    total = keys.length,
    i, key;
  this[name] = {};
  for (i = 0; i < total; i++) {
    key = keys[i];
    if (typeof props[key] === 'function') {
      this[name][key] = props[key].bind(this);
    }
    else {
      this[name][key] = exports.clone(props[key]);
    }
  }
  return this;
};

/**
 * Shallow clone the given value.
 *
 * @param  {Mixed} item The item to clone.
 * @return {Mixed}      The cloned item.
 */
exports.clone = function (item) {
  if (Object(item) !== item) {
    return item;
  }
  else if (Array.isArray(item)) {
    return item.slice();
  }

  var keys = Object.keys(item),
    total = keys.length,
    cloned = {},
    key, i;
  for (i = 0; i < total; i++) {
    key = keys[i];
    cloned[key] = item[key];
  }
  return cloned;
};

/**
 * Escape the given input for use in a query.
 *
 * > NOTE: Because of a fun quirk in OrientDB's parser, this function can only be safely
 * used on SQL segments that are enclosed in DOUBLE QUOTES (") not single quotes (').
 *
 * @param  {String} input The input to escape.
 * @return {String}       The escaped input.
 */
exports.escape = function (input) {
  var text = '' + input;
  var chars = new Array(text.length);
  for (var i = 0; i < text.length; i++) {
    var char = text.charAt(i);
    if (char === '\r') {
      chars[i] = '\\r';
    }
    else if (char === '\n') {
      chars[i] = '\\n';
    }
    else if (char === '"') {
      chars[i] = '\\"';
    }
    else if (char === '\\') {
      chars[i] = '\\\\';
    }
    else {
      chars[i] = char;
    }
  }
  return chars.join('');
};

/**
 * Prepare a query.
 *
 * @param  {String} query  The query to prepare.
 * @param  {Object} params The bound parameters for the query.
 * @return {String}        The prepared query.
 */
exports.prepare = function (query, params) {
  if (!params) {
    return query;
  }
  else if (params instanceof ArrayLike || Array.isArray(params)) {
    return prepareArray(query, params);
  }
  else {
    return prepareObject(query, params);
  }
};


function prepareArray(query, params) {
  var pattern = /"(\\[\s\S]|[^"])*"|'(\\[\s\S]|[^'])*'|(\?)/g;
  var n = 0;
  return query.replace(pattern, function (all, double, single, param) {
    if (param) {
      return exports.encode(params[n++]);
    }
    else {
      return all;
    }
  });
}

function prepareObject(query, params) {
  var pattern = /"(\\[\s\S]|[^"])*"|'(\\[\s\S]|[^'])*'|([^A-Za-z0-9]:([A-Za-z][A-Za-z0-9_-]*))/g;
  return query.replace(pattern, function (all, double, single, char, param) {
    if (param && params[param] !== undefined) {
      return char.charAt(0) + exports.encode(params[param]);
    }
    else {
      return all;
    }
  });
}

/**
 * Encode a value for use in a query, escaping and quoting it if required.
 *
 * @param  {Mixed} value The value to encode.
 * @return {Mixed}       The encoded value.
 */
exports.encode = function encode(value) {

  if (!RawExpression) {
    RawExpression = require('./db/statement').RawExpression;
  }
  if (value == null) {
    return 'null';
  } else if (value instanceof RawExpression) {
    return value.toString();
  }
  else if (typeof value === 'number') {
    return value;
  }
  else if (typeof value === 'boolean') {
    return value;
  }
  else if (typeof value === 'string') {
    return '"' + exports.escape(value) + '"';
  }
  else if (value instanceof Date) {
    return 'date("' + getOrientDbUTCDate(value) + '", "yyyy-MM-dd HH:mm:ss.SSS", "UTC")';
  }
  else if (value instanceof RID) {
    return value.toString();
  }
  else if (typeof value.toOrient === 'function') {
    return encode(value.toOrient());
  }
  else if (Array.isArray(value)) {
    return '[' + value.map(encode) + ']';
  }
  else {

    var keys = Object.keys(value),
      length = keys.length;

    var parts = new Array(length),
      key, i;
    for (i = 0; i < length; i++) {
      key = keys[i];
      parts[i] = '"' + exports.escape(key) + '":' + encode(value[key]);
    }
    return '{' + parts.join(',') + '}';
  }
};


/**
 * Safely encode a value as JSON, allowing circular references.
 * When a record is encountered more than once, subsequent references
 * will embed the record's RID rather than the record itself.
 *
 * @param  {Mixed}   value        The value to JSON stringify.
 * @param  {Integer} indentlevel  The indentation level, if specified the JSON will be pretty printed.
 * @return {String}               The JSON string.
 */
exports.jsonify = function (value, indentlevel) {
  var seen = [];
  return JSON.stringify(value, function (key, value) {
    if (value && typeof value === 'object') {
      if (~seen.indexOf(value)) {
        if (value['@rid']) {
          return value['@rid'].toJSON();
        }
        return;
      }
      seen.push(value);
    }
    return value;
  }, indentlevel);
};


/**
 * Define a deprecated method or property.
 *
 * A warning message will be displayed the first time the method is called, regardless of the object.
 *
 * @param  {Object}   context The context for the method.
 * @param  {String}   name    The name of the deprecated method.
 * @param  {String}   message The message to display.
 * @param  {Function} fn      The function to call, it should restore the real property.
 */
exports.deprecate = function (context, name, message, fn) {
  var shown = false;
  Object.defineProperty(context, name, {
    configurable: true,
    enumerable: true,
    get: function () {
      if (!shown) {
        console.warn(message);
        shown = true;
      }
      delete this[name];
      fn.call(this, name);
      return this[name];
    }
  });
};


/**
 * Converts a date object to string observing OrientDB's default format
 *
 * @param  {Date}   The value to convert
 * @return {String} The string formatted as 'yyyy-MM-dd HH:mm:ss'
 */
function getOrientDbUTCDate(date) {
  var yyyy = pad(date.getUTCFullYear(), 4);
  var MM = pad(date.getUTCMonth() + 1, 2);
  var dd = pad(date.getUTCDate(), 2);
  var HH = pad(date.getUTCHours(), 2);
  var mm = pad(date.getUTCMinutes(), 2);
  var ss = pad(date.getUTCSeconds(), 2);
  var SSS = pad(date.getUTCMilliseconds(), 3);

  return yyyy + '-' + MM + '-' + dd + ' ' + HH + ':' + mm + ':' + ss + '.' + SSS;
}

function pad(number, size) {
  return (1e4 + number + "").slice(-size);
}

/**
 * Determine whether the given expression needs to be wrapped in parentheses or not.
 * @param  {String} input The string to check.
 * @return {Boolean}      `true` if parentheses are required, otherwise false.
 */
exports.requiresParens = function (input) {
  if (typeof input !== 'string') {
    return false;
  }
  var text = input.trim();
  var exprCount = 0;
  var inParens = 0;
  var inQuotes = false;
  for (var i = 0; i < text.length; i++) {
    var char = text.charAt(i);
    if (inQuotes) {
      if (char === '\\') {
        i += 1;
      }
      else if (char === inQuotes) {
        inQuotes = false;
      }
    }
    else if (char === '"' || char === "'") {
      inQuotes = char;
    }
    else if (char === '(') {
      if (inParens === 0) {
        exprCount++;
      }
      inParens++;
    }
    else if (char === ')') {
      inParens--;
    }
    else if (char === "\t" || char === "\r" || char === "\n" || char === " ") {
      if (inParens === 0) {
        return true;
      }
    }
  }
  return false;
};


/**
 * A class used solely to indicate that an object is an "array like"
 * It should never be used directly and is a temporary hack around some poor design decisions.
 */
function ArrayLike() {
}

exports.ArrayLike = ArrayLike;
