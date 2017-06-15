/*jshint esversion: 6 */
"use strict";

const Class = require('../../db/class');


/**
 *
 */
class SessionClass extends Class {

  constructor(cfg) {
    super(cfg);
  }
}

module.exports = exports = SessionClass;



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
exports.create = function (name, parentName, cluster, isAbstract , ifnotexist) {
  var query = 'CREATE CLASS ' + name;

  if (ifnotexist) {
    query += (ifnotexist===true ? " IF NOT EXISTS " : "");
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

  return this.query(query).all()
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