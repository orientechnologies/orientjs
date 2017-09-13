/*jshint esversion: 6 */
"use strict";

const Class = require('../../db/class');
const DatabaseProperty = require('./property');

/**
 *
 */
class DatabaseClass extends Class {

  constructor(cfg) {
    super(cfg);
    this.augment('property', DatabaseProperty);
  }
}

module.exports = exports = DatabaseClass;


// Inherit from db/class

Object.keys(Class).forEach((k) => {
  exports[k] = Class[k];
});


/**
 * Create a new class.
 *
 * @param  {String} name            The name of the class to create.
 * @param  {String} parentName      The name of the parent to extend, if any.
 * @param  {String|Integer} cluster The cluster name or id.
 * @param  {Boolean} isAbstract     The flag for the abstract class
 * @promise {Object}                The created class object
 */
exports.create = function (name, parentName, cluster, isAbstract, ifnotexist) {
  var query = 'CREATE CLASS ' + name;

  if (ifnotexist) {
    query += (ifnotexist === true ? " IF NOT EXISTS " : "");
  }

  if (parentName) {
    query += ' EXTENDS ' + parentName;
  }

  if (cluster) {
    query += ' CLUSTER ' + cluster;
  }

  if (isAbstract) {
    query += ' ABSTRACT';
  }


  return this.command(query).all()
    .bind(this)
    .then(function () {
      return this.reload();
    })
    .then(function () {
      return this.class.list(true);
    })
    .then(function (classes) {
      return this.class.get(name);
    });
};

/**
 * Cache the given class data for fast lookup later.
 *
 * @param  {Object[]} classes The class objects to cache.
 * @return {Db}                The db instance.
 */
exports.cacheData = function (classes) {
  var total = classes.length,
    item, i;

  classes = classes.map(function (item) {
    item.db = this;
    return new DatabaseClass(item);
  }, this);


  this.class.cached = {
    names: {},
    items: classes
  };

  for (i = 0; i < total; i++) {
    item = classes[i];
    this.class.cached.names[item.name.toLocaleUpperCase()] = item;
  }

  return this;
};
