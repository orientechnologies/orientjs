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
 * @param   {Boolean} reload      Whether to reload the property, default to true.
 * @promise {Object}              The created property.
 */
exports.create = function (config, reload) {
  if (reload == null) reload = true;

  if (Array.isArray(config)) {
    return Promise.all(config.map(function (item) {
      return this.property.create(item, false);
    }, this))
    .bind(this)
    .then(function (results) {
      if (reload)
        return this.reload();
      else
        return this;
    })
    .then(function () {
      var total = config.length,
          promises = [],
          name, i;
      for (i = 0; i < total; i++) {
        name = config[i].name || config[i];
        promises.push(this.property.get(name));
      }
      return Promise.all(promises);
    });
  }

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
    delete config.linkedClass;
    delete config.linkedType;
  }

  return this.db.exec(query)
  .bind(this)
  .then (function () {
    var total = Object.keys(config).length;
    if (total === 2) {
      // only name and type are set,
      // we can avoid the update
      return reload ? this.reload() : this;
    }
    else {
      delete config.type;
      return this.property.update(config, reload);
    }
  })
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
 * @param   {Object}  property The property settings.
 * @param   {Boolean} reload   Whether to reload the property, default to true.
 * @promise {Object}           The updated property.
 */
exports.update = function (property, reload) {
  var promises = [],
      prefix = 'ALTER PROPERTY ' + this.name + '.' + property.name + ' ',
      keys, total, key, i;

  if (reload == null) reload = true;

  if (property.linkedClass !== undefined) {
    promises.push(this.db.exec(prefix + 'LINKEDCLASS ' + property.linkedClass));
  }
  if (property.linkedType !== undefined) {
    promises.push(this.db.exec(prefix + 'LINKEDTYPE ' + property.linkedType));
  }
  if (property.min !== undefined) {
    promises.push(this.db.exec(prefix + 'MIN ' + property.min));
  }
  if (property.max !== undefined) {
    promises.push(this.db.exec(prefix + 'MAX ' + property.max));
  }
  if (property.regexp !== undefined) {
    promises.push(this.db.exec(prefix + 'REGEXP ' + property.regexp));
  }
  if (property.type !== undefined) {
    promises.push(this.db.exec(prefix + 'TYPE ' + property.type));
  }
  if (property.mandatory !== undefined) {
    promises.push(this.db.exec(prefix + 'MANDATORY ' + (property.mandatory ? 'true' : 'false')));
  }
  if (property.notNull !== undefined) {
    promises.push(this.db.exec(prefix + 'NOTNULL ' + (property.notNull ? 'true' : 'false')));
  }

  if (property.custom) {
    keys = Object.keys(property.custom);
    total = keys.length;
    for (i = 0; i < total; i++) {
      key = keys[i];
      promises.push(this.db.exec(prefix + 'CUSTOM ' + key + ' = ' + property.custom[key]));
    }
  }

  return Promise.all(promises)
  .bind(this)
  .then(function () {
    if (reload)
      return this.reload();
  })
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
  return this.db.exec('DROP PROPERTY ' + this.name + '.' + name)
  .bind(this)
  .then(this.reload)
  .return(this);
};

/**
 * Alter the given property.
 *
 * @param   {String} name    The name of the property to alter.
 * @param   {String} setting The property setting.
 * @promise {Class}          The class instance with property altered.
 */
exports.alter = function (name, setting) {
  return this.db.exec('ALTER PROPERTY ' + this.name + '.' + name + ' ' + setting)
  .bind(this)
  .then(this.reload)
  .return(this);
};

/**
 * Rename a proprerty.
 *
 * @param   {String} oldName The existing name of the property.
 * @param   {String} newName The new name for the property.
 * @promise {Object}         The renamed property instance.
 */
exports.rename = function (oldName, newName) {
  return this.db.exec('ALTER PROPERTY ' + this.name + '.' + oldName + ' NAME ' + newName)
  .bind(this)
  .then(this.reload)
  .then(function () {
    return this.property.get(newName);
  });
};

