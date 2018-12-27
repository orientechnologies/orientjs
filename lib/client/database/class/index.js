/*jshint esversion: 6 */
"use strict";

const Class = require("../../../db/class");
const DatabaseProperty = require("./property");
const Promise = require("bluebird");
const errors = require('../../../errors');

/**
 *
 */
class DatabaseClass extends Class {
  constructor(cfg) {
    super(cfg);
    this.augment("property", DatabaseProperty);
  }

  /**
   * Configure the class instance.
   * @param  {Object} config The configuration object.
   */
  configure(config) {
    this.db = config.db;
    this.name = config.name || "";
    this.shortName = config.shortName || null;
    this.defaultClusterId = config.defaultClusterId || null;
    this.clusterIds = config.clusterIds || [];
    this.properties = (config.properties || []).map(function(item) {
      item.class = this;
      return new DatabaseProperty(item);
    }, this);
    this.superClass = config.superClass || null;
    this.superClasses = config.superClasses || null;
    this.originalName = this.name;
    if (config.custom && config.custom.fields) {
      this.custom.fields = config.custom.fields;
    } else if (config.customFields) {
      this.custom.fields = config.customFields;
    }
  }

  /**
   * Reload the class instance.
   *
   * @promise {DatabaseClass} The class instance.
   */
  reload() {
    return this.db.class
      .get(this.originalName, true)
      .bind(this)
      .then(function(item) {
        this.configure(item);
        return this;
      });
  }
}

module.exports = exports = DatabaseClass;

// Inherit from db/class

Object.keys(Class).forEach(k => {
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
exports.create = function(name, parentName, cluster, isAbstract, ifnotexist) {
  var query = "CREATE CLASS " + name;

  if (ifnotexist) {
    query += ifnotexist === true ? " IF NOT EXISTS " : "";
  }

  if (parentName) {
    query += " EXTENDS " + parentName;
  }

  if (cluster) {
    query += " CLUSTER " + cluster;
  }

  if (isAbstract) {
    query += " ABSTRACT";
  }

  return this.command(query)
    .all()
    .bind(this)
    .then(function() {
      return this.reload();
    })
    .then(function() {
      return this.class.list(true);
    })
    .then(function(classes) {
      return this.class.get(name);
    });
};

/**
 * Cache the given class data for fast lookup later.
 *
 * @param  {Object[]} classes The class objects to cache.
 * @return {Db}                The db instance.
 */
exports.cacheData = function(classes) {
  var total = classes.length,
    item,
    i;

  classes = classes.map(function(item) {
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

/**
 * Get a class by name.
 *
 * @param   {Integer|String} name The name of the class.
 * @param   {Boolean} refresh Whether to refresh the data, defaults to false.
 * @promise {Object}          The class object if it exists.
 */
exports.get = function(name, refresh) {
  var className = name.toLocaleUpperCase();
  if (!refresh && this.class.cached && this.class.cached.names[className]) {
    return Promise.resolve(this.class.cached.names[className]);
  } else if (!this.class.cached || refresh) {
    return this.class
      .list(refresh)
      .bind(this)
      .then(function() {
        return (
          this.class.cached.names[className] ||
          Promise.reject(new errors.Request("No such class: " + name))
        );
      });
  } else {
    return Promise.reject(new errors.Request("No such class: " + name));
  }
};

/**
 * Retreive a list of classes from the database.
 *
 * @param  {Boolean} refresh Whether to refresh the list or not.
 * @promise {Object[]}       An array of class objects.
 */
exports.list = function(refresh) {
  if (!refresh && this.class.cached) {
    return Promise.resolve(this.class.cached.items);
  }

  return this.send("record-load", {
    cluster: 0,
    position: 1
  })
    .bind(this)
    .then(function(response) {
      var record = response.records[0];
      if (!record || !record.classes) {
        return [];
      } else {
        return record.classes;
      }
    })
    .then(this.class.cacheData)
    .then(function() {
      return this.class.cached.items;
    });
};
