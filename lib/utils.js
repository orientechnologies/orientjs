var _ = require('lodash');

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

  if (source.hasOwnProperty('constructor'))
    child = source.constructor;
  else
    child = function () { return parent.apply(this, arguments); };

  var Surrogate = function () { this.constructor = child; };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate;

  var keys, key, i, limit;

  for (keys = Object.keys(parent), key = null, i = 0, limit = keys.length; i < limit; i++) {
    key = keys[i];
    if (key !== 'prototype')
      child[key] = parent[key];
  }

  for (keys = Object.keys(source), key = null, i = 0, limit = keys.length; i < limit; i++) {
    key = keys[i];
    if (key.charCodeAt(0) === 64) // @
      child[key.slice(1)] = source[key];
    else if (key !== 'constructor')
      child.prototype[key] = source[key];
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
      this[name][key] = _.clone(props[key]);
    }
  }
  return this;
}