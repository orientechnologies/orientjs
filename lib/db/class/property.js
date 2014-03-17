var Promise = require('bluebird'),
    errors = require('../../errors');

/**
 * List all the properties in the class.
 *
 * @promise {Object[]} The class properties
 */
exports.list = function () {
  return Promise.resolve(this.properties);
};

/**
 * Create a new property.
 *
 * @param  {String|Object} config The property name or configuration.
 * @promise {Object}              The created property.
 */
exports.create = function (config) {
  var query = 'CREATE PROPERTY ' + this.name + '.';
  if (typeof config === 'string') {
    config = {
      name: config
    };
  }
  config.type = config.type || 'string';

  query += config.name + ' ' + config.type;

  if (config.linkedClass || config.linkedType) {
    query += ' ' + (config.linkedClass || config.linkedType);
  }

  return this.db.exec(query)
  .bind(this)
  .then(this.reload)
  .then(function () {
    return this.property.get(config.name);
  });
};

/**
 * Get the property with the given name.
 *
 * @param   {String} name   The property to get.
 * @promise {Object|null}   The retrieved property.
 */
exports.get = function (name) {
  var total = this.properties.length,
      i, item;
  for (i = 0; i < total; i++) {
    item = this.properties[i];
    if (item.name === name)
      return Promise.resolve(item);
  }

  return Promise.resolve(null);
};

/**
 * Update the given property.
 *
 * @param   {Object} property The property settings.
 * @promise {Object}          The updated property.
 */
exports.update = function (property) {
  var promises = [],
      prefix = 'ALTER PROPERTY ' + this.name + '.' + property.name + ' ',
      keys, total, key, i;

  if (property.linkedClass !== undefined) {
    promises.push(this.db.query(prefix + 'LINKEDCLASS ' + property.linkedClass));
  }
  if (property.linkedType !== undefined) {
    promises.push(this.db.query(prefix + 'LINKEDTYPE ' + property.linkedType));
  }
  if (property.min !== undefined) {
    promises.push(this.db.query(prefix + 'MIN ' + property.min));
  }
  if (property.max !== undefined) {
    promises.push(this.db.query(prefix + 'MAX ' + property.max));
  }
  if (property.regexp !== undefined) {
    promises.push(this.db.query(prefix + 'REGEXP ' + property.regexp));
  }
  if (property.type !== undefined) {
    promises.push(this.db.query(prefix + 'TYPE ' + property.type));
  }
  if (property.custom) {
    keys = Object.keys(property.custom);
    total = keys.length;
    for (i = 0; i < total; i++) {
      key = keys[i];
      promises.push(this.db.query(prefix + 'CUSTOM ' + key + ' = ' + property.custom[key]));
    }
  }

  return Promise.all(promises)
  .bind(this)
  .then(this.reload)
  .then(function () {
    return this.property.get(property.name);
  });
};

/**
 * Drop the given property.
 *
 * @param   {String} name The property name.
 * @promise {Class}       The class instance with property removed.
 */
exports.delete = function (name) {
  return this.db.query('DROP PROPERTY ' + this.name + '.' + name)
  .bind(this)
  .then(this.reload)
  .return(this);
};

/**
 * Alter the given property.
 *
 * @param   {String} name    The name of the property to alter.
 * @param   {String} setting The property setting.
 * @promise {Class}       The class instance with property altered.
 */
exports.alter = function (name, setting) {
  return this.db.query('ALTER PROPERTY ' + this.name + '.' + name + ' ' + setting)
  .bind(this)
  .then(this.reload)
  .return(this);
};

