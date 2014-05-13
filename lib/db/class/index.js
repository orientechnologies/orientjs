"use strict";

var Promise = require('bluebird'),
    Property = require('./property'),
    RID = require('../../recordid'),
    utils = require('../../utils'),
    errors = require('../../errors');

/**
 * The class constructor.
 * @param {Object} config The configuration for the class
 */
function Class (config) {
  config = config || {};
  if (!(this instanceof Class)) {
    return new Class(config);
  }
  this.augment('property', Property);
  this.augment('custom', require('./custom'));
  this.configure(config);
}


Class.prototype.augment = utils.augment;

module.exports = exports = Class;

/**
 * Configure the class instance.
 * @param  {Object} config The configuration object.
 */
Class.prototype.configure = function (config) {
  this.db = config.db;
  this.name = config.name || '';
  this.shortName = config.shortName || null;
  this.defaultClusterId = config.defaultClusterId || null;
  this.clusterIds = config.clusterIds || [];
  this.properties = (config.properties || []).map(function (item) {
    item.class = this;
    return new Property(item);
  }, this);
  this.superClass = config.superClass || null;
  this.originalName = this.name;
  if (config.custom && config.custom.fields) {
    this.custom.fields = config.custom.fields;
  }
  else if (config.customFields) {
    this.custom.fields = config.customFields;
  }
};


/**
 * Return a list of records in the class.
 *
 * @param  {Integer|Object} limit  The maximum number of records to return, or a configuration object.
 * @param  {Integer} offset The offset to start returning records from.
 * @promise {Object[]}      An array of records in the class.
 */
Class.prototype.list = function (limit, offset) {
  var query = 'SELECT * FROM ' + this.name,
      config = {};

  if (limit && typeof limit === 'object') {
    config = limit;
    limit = config.limit;
    offset = config.offset;
  }
  limit = +limit || 20;
  offset = +offset || 0;

  if (limit !== Infinity) {
    query += ' LIMIT ' + limit + ' OFFSET ' + offset;
  }
  else {
    query += ' OFFSET ' + offset;
  }

  return this.db.query(query, config);
};

/**
 * Find a list of records in the class.
 *
 * @param  {Object}  attributes The attributes to search with.
 * @param  {Integer} limit      The maximum number of records to return
 * @param  {Integer} offset     The offset to start returning records from.
 * @promise {Object[]}          An array of records in the class.
 */
Class.prototype.find = function (attributes, limit, offset) {
  var query = 'SELECT * FROM ' + this.name,
      keys = Object.keys(attributes),
      total = keys.length,
      conditions = [],
      params = {},
      key, sanitizedKey, value, i;

  for (i = 0; i < total; i++) {
    key = keys[i];
    value = attributes[key];
    sanitizedKey = key.replace(/\./g, '_');
    params[sanitizedKey] = value;
    conditions.push(key + ' = :' + sanitizedKey);
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  limit = +limit || 20;
  offset = +offset || 0;

  if (limit !== Infinity) {
    query += ' LIMIT ' + limit + ' OFFSET ' + offset;
  }
  else {
    query += ' OFFSET ' + offset;
  }


  return this.db.query(query, {
    params: params
  });
};


/**
 * Create a record for this class.
 *
 * @param   {Object} record The record to create.
 * @promise {Object}        The created record.
 */
Class.prototype.create = function (record) {
  if (Array.isArray(record)) {
    return Promise.map(record, this.create.bind(this));
  }
  record['@class'] = this;
  return this.db.record.create(record)
  .then(function (record) {
    delete record['@class'];
    return record;
  });
};

/**
 * Reload the class instance.
 *
 * @promise {Class} The class instance.
 */
Class.prototype.reload = function () {
  return this.db.class.get(this.originalName, true)
  .bind(this)
  .then(function (item) {
    this.configure(item);
    return this;
  });
};

/**
 * Static methods.
 * These methods are invoked with the database instance as `this`, not `Class`!
 */

/**
 * The cached class items.
 * @type {Object|false}
 */
exports.cached = false;

/**
 * Retreive a list of classes from the database.
 *
 * @param  {Boolean} refresh Whether to refresh the list or not.
 * @promise {Object[]}       An array of class objects.
 */
exports.list = function (refresh) {
  if (!refresh && this.class.cached) {
    return Promise.resolve(this.class.cached.items);
  }

  return this.send('record-load', {
    cluster: 0,
    position: 1
  })
  .bind(this)
  .then(function (response) {
    var record = response.records[0];
    if (!record || !record.classes) {
      return [];
    }
    else {
      return record.classes;
    }
  })
  .then(this.class.cacheData)
  .then(function () {
    return this.class.cached.items;
  });
};

/**
 * Create a new class.
 *
 * @param  {String} name            The name of the class to create.
 * @param  {String} parentName      The name of the parent to extend, if any.
 * @param  {String|Integer} cluster The cluster name or id.
 * @promise {Object}                The created class object
 */
exports.create = function (name, parentName, cluster) {
  var query = 'CREATE CLASS ' + name;

  if (parentName) {
    query += ' EXTENDS ' + parentName;
  }

  if (cluster) {
    query += ' CLUSTER ' + cluster;
  }

  return this.query(query)
  .bind(this)
  .then(function () {
    return this.class.list(true);
  })
  .then(function (classes) {
    return this.class.get(name);
  });
};


/**
 * Delete a class.
 *
 * @param  {String} name The name of the class to delete.
 * @promise {Db}         The database instance.
 */
exports.drop = function (name) {
  return this.exec('DROP CLASS ' + name)
  .bind(this)
  .then(function () {
    return this.class.list(true);
  })
  .then(function (classes) {
    return this;
  });
};


/**
 * Get a class by name.
 *
 * @param   {Integer|String} name The name of the class.
 * @param   {Boolean} refresh Whether to refresh the data, defaults to false.
 * @promise {Object}          The class object if it exists.
 */
exports.get = function (name, refresh) {
  if (!refresh && this.class.cached && this.class.cached.names[name]) {
    return Promise.resolve(this.class.cached.names[name]);
  }
  else if (!this.class.cached || refresh) {
    return this.class.list(refresh)
    .bind(this)
    .then(function () {
      return this.class.cached.names[name] || Promise.reject(new errors.Request('No such class: ' + name));
    });
  }
  else {
    return Promise.reject(new errors.Request('No such class: ' + name));
  }
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
    return new Class(item);
  }, this);


  this.class.cached = {
    names: {},
    items: classes
  };

  for (i = 0; i < total; i++) {
    item = classes[i];
    this.class.cached.names[item.name] = item;
  }

  return this;
};