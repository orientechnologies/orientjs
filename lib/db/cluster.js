"use strict";

var Promise = require('bluebird'),
    errors = require('../errors');

/**
 * The cached cluster items.
 * @type {Object|false}
 */
exports.cached = false;

/**
 * Retreive a list of clusters from the database.
 *
 * @param  {Boolean} refresh Whether to refresh the list or not.
 * @promise {Object[]}       An array of cluster objects.
 */
exports.list = function (refresh) {
  if (!refresh && this.cluster.cached) {
    return Promise.resolve(this.cluster.cached.items);
  }

  if (this.sessionId) {
    // db is already open, reload
    return this.reload()
    .bind(this)
    .then(function () {
      // reload calls `cacheData`
      return this.cluster.cached.items;
    });
  }
  else {
    return this.open()
    .bind(this)
    .then(function () {
      // open calls `cacheData`
      return this.cluster.cached.items;
    });
  }
};

/**
 * Create a new cluster.
 *
 * @param   {String} name      The name of the cluster.
 * @param   {String} location  The location of the cluster.
 * @promise {Object}           The cluster object.
 */
exports.create = function (name, location) {
  return this.send('datacluster-add', {
    name: name,
    location: location || 'physical'
  })
  .bind(this)
  .then(function (response) {
    return this.reload();
  })
  .then(function () {
    return this.cluster.getByName(name);
  });
};

/**
 * Get a cluster by name or id.
 *
 * @param   {Integer|String} nameOrId The name or id of the cluster.
 * @param   {Boolean} refresh Whether to refresh the data, defaults to false.
 * @promise {Object}          The cluster object if it exists.
 */
exports.get = function (nameOrId, refresh) {
  if (+nameOrId == nameOrId) {
    return this.cluster.getById(nameOrId, refresh);
  }
  else {
    return this.cluster.getByName(nameOrId, refresh);
  }
};

/**
 * Get a cluster by name
 *
 * @param   {String}  name    The name of the cluster.
 * @param   {Boolean} refresh Whether to refresh the data, defaults to false.
 * @promise {Object}          The cluster object if it exists.
 */
exports.getByName = function (name, refresh) {
  name = name.toLowerCase();
  if (!refresh && this.cluster.cached && this.cluster.cached.names[name]) {
    return Promise.resolve(this.cluster.cached.names[name]);
  }
  else if (!this.cluster.cached || refresh) {
    return this.cluster.list(refresh)
    .bind(this)
    .then(function () {
      return this.cluster.cached.names[name];
    });
  }
  else {
    return Promise.resolve(undefined);
  }
};

/**
 * Get a cluster by id
 *
 * @param   {String}  name    The id of the cluster.
 * @param   {Boolean} refresh Whether to refresh the data, defaults to false.
 * @promise {Object}          The cluster object if it exists.
 */
exports.getById = function (id, refresh) {
  if (!refresh && this.cluster.cached && this.cluster.cached.ids[id]) {
    return Promise.resolve(this.cluster.cached.ids[id]);
  }
  else if (!this.cluster.cached || refresh) {
    return this.cluster.list(refresh)
    .bind(this)
    .then(function () {
      return this.cluster.cached.ids[id];
    });
  }
  else {
    return Promise.resolve(undefined);
  }
};

/**
 * Delete a cluster.
 *
 * @param   {String} nameOrId  The name or id of the cluster.
 * @promise {Db}               The database.
 */
exports.drop = function (nameOrId) {
  return this.cluster.get(nameOrId)
  .bind(this)
  .then(function (cluster) {
    if (!cluster) {
      throw new errors.Operation('Cannot delete a data cluster that does not exist!');
    }
    return this.send('datacluster-drop', {
      id: cluster.id
    });
  })
  .then(function (response) {
    return this.reload();
  });
};

/**
 * Count the records in a cluster
 *
 * @param   {String} nameOrId  The name of the cluster.
 * @promise {Integer}          The number of records in the cluster.
 */
exports.count = function (nameOrId) {
  return this.cluster.get(nameOrId)
  .bind(this)
  .then(function (cluster) {
    return this.send('datacluster-count', {
      id: cluster.id
    });
  })
  .then(function (response) {
    return response.count;
  });
};

/**
 * Get the range of records in a cluster
 *
 * @param   {String} nameOrId The name of the cluster.
 * @promise {Object}          The object containing the start and end values.
 */
exports.range = function (nameOrId) {
  return this.cluster.get(nameOrId)
  .bind(this)
  .then(function (cluster) {
    return this.send('datacluster-datarange', {
      id: cluster.id
    });
  })
  .then(function (response) {
    return {
      start: response.begin,
      end: response.end
    };
  });
};

/**
 * Cache the given cluster data for fast lookup later.
 *
 * @param  {Object[]} clusters The cluster objects to cache.
 * @return {Db}                The db instance.
 */
exports.cacheData = function (clusters) {
  var total = clusters.length,
      item, i;

  this.cluster.cached = {
    ids: {},
    names: {},
    items: clusters
  };

  for (i = 0; i < total; i++) {
    item = clusters[i];
    this.cluster.cached.ids[item.id] = item;
    this.cluster.cached.names[item.name] = item;
  }

  return this;
};