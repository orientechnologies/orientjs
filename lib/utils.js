"use strict";

var RID = require('./recordid');

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
    child = function () { return parent.apply(this, arguments); };
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
    if (key.charCodeAt(0) === 64)  {
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
 * @param  {String} input The input to escape.
 * @return {String}       The escaped input.
 */
exports.escape = function (input) {
  return ('' + input).replace(/([^'\\]*(?:\\.[^'\\]*)*)'/g, '$1\\"');
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
  var pattern = /"(\\[\s\S]|[^"])*"|'(\\[\s\S]|[^'])*'|:([A-Za-z][A-Za-z0-9_-]*|\/\*[\s\S]*?\*\/)/g;
  return query.replace(pattern, function (all, double, single, param) {
    if (param) {
      return exports.encode(params[param]);
    }
    else {
      return all;
    }
  });
};

/**
 * Encode a value for use in a query, escaping and quoting it if required.
 *
 * @param  {Mixed} value The value to encode.
 * @return {Mixed}       The encoded value.
 */
exports.encode = function (value) {
  if (value == null) {
    return 'null';
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
  else if (value instanceof RID) {
    return value.toString();
  }
  else if (Array.isArray(value)) {
    return '[' + value.map(exports.encode) + ']';
  }
  else {
    return JSON.stringify(value);
  }
};