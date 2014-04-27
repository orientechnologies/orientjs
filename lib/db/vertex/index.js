"use strict";

var Promise = require('bluebird'),
    RID = require('../../recordid'),
    errors = require('../../errors');

/**
 * Create a new vertex.
 *
 * @param   {Mixed} config  The vertex class name or configuration.
 * @promise {Object}        The created vertex.
 */
exports.create = function (config) {
  if (Array.isArray(config))  {
    return Promise.map(config, this.vertex.create, this);
  }
  var command = 'CREATE VERTEX',
      promise, cluster, className, attributes;
  config = vertexConfig(config);
  className = config[0];
  cluster = config[1];
  attributes = config[2];
  if (cluster && +cluster == cluster) {
    promise = Promise.resolve(cluster);
  }
  else if (cluster) {
    promise = this.cluster.get(cluster);
  }
  else {
    promise = Promise.resolve();
  }
  return promise
  .bind(this)
  .then(function (cluster) {
    command += " " + className;
    if (cluster && cluster.id) {
      cluster = cluster.id;
    }
    if (cluster) {
      command += " CLUSTER " + cluster;
    }
    if (attributes) {
      command += " CONTENT " + JSON.stringify(attributes);
    }
    return this.query(command);
  })
  .then(function (results) {
    return results[0];
  });
};

/**
 * Delete the given vertex.
 *
 * @param   {Mixed} config  The vertex to delete.
 * @promise {Integer}       The number of vertices deleted.
 */
exports.delete = function (config) {
  var rid = config['@rid'] || RID.parse(config),
      command;
  if (!rid) {
   throw new errors.Operation('Only deletion by record id is currently supported.');
  }

  command = 'DELETE VERTEX ' + rid;
  return this.query(command)
  .then(function (response) {
    return +response || 0;
  });
};

/**
 * Extract the class name, cluster id and vertex configuration from the given string / object.
 *
 * @param  {String|Object} config  The configuration object or class name.
 * @return {[String, String|undefined, Object|undefined]}      The class name, cluster and any configuration object.
 */
function vertexConfig (config) {
  var className = 'V',
      cluster, obj, keys, key, total, i;

  if (typeof config === 'string') {
    className = config;
  }
  else if (config && typeof config === 'object') {
    keys = Object.keys(config);
    total = keys.length;
    obj = {};
    for (i = 0; i < total; i++) {
      key = keys[i];
      if (key.charAt(0) === '@') {
        continue;
      }
      obj[key] = config[key];
    }
    if (config['@class']) {
      className = config['@class'];
    }
    if (config['@cluster']) {
      cluster = config['@cluster'];
    }
  }
  return [className, cluster, obj];
}