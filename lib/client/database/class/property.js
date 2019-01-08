/*jshint esversion: 6 */
"use strict";

const Property = require("../../../db/class/property");
const Promise = require("bluebird");

class DatabaseProperty extends Property {
  constructor(cfg) {
    super(cfg);
    this.augment("custom", require("./custom"));
    this.configure(cfg || {});
  }

  create(config, reload) {}

  configure(config) {
    this.class = config.class;
    this.name = config.name || "";
    this.originalName = this.name;
    this.type = config.type;
    this.ifnotexist = config.ifnotexist;
    this.mandatory = config.mandatory || false;
    this.defaultValue =
      typeof config.defaultValue !== "undefined" ? config.defaultValue : null;
    this.readonly = config.readonly || false;
    this.notNull = config.notNull || false;
    this.collate = config.collate || "default";
    this.min = typeof config.min !== "undefined" ? config.min : null;
    this.max = typeof config.max !== "undefined" ? config.max : null;
    this.regexp = config.regexp || null;
    this.linkedClass = config.linkedClass || null;
    this.linkedType = config.linkedType || null;
    if (config.custom && config.custom.fields) {
      this.custom.fields = config.custom.fields;
    } else if (config.customFields) {
      this.custom.fields = config.customFields;
    }
  }

  /**
   * Reload the property instance.
   *
   * @promise {Property} The property instance.
   */
  reload() {
    return this.class
      .reload()
      .bind(this)
      .then(function(item) {
        return item.property.get(this.originalName, true);
      })
      .then(function(item) {
        this.configure(item);
        return this;
      });
  }
}

module.exports = exports = DatabaseProperty;

// Inherit from db/class

Object.keys(Property).forEach(k => {
  exports[k] = Property[k];
});

/**
 * Create a new property.
 *
 * @param  {String|Object} config The property name or configuration.
 * @param   {Boolean} reload      Whether to reload the property, default to true.
 * @promise {Object}              The created property.
 */
exports.create = function(config, reload) {
  if (reload == null) {
    reload = true;
  }

  if (Array.isArray(config)) {
    return Promise.all(
      config.map(function(item) {
        return this.property.create(item, false);
      }, this)
    )
      .bind(this)
      .then(function(results) {
        if (reload) {
          return this.reload();
        } else {
          return this;
        }
      })
      .then(function() {
        var total = config.length,
          promises = [],
          name,
          i;
        for (i = 0; i < total; i++) {
          name = config[i].name || config[i];
          promises.push(this.property.get(name));
        }
        return Promise.all(promises);
      });
  }

  var query = "CREATE PROPERTY " + this.name + ".";

  if (typeof config === "string") {
    config = {
      name: config
    };
  }
  config.type = config.type || "string";
  config.ifnotexist = config.ifnotexist ? config.ifnotexist : false;
  config.unsafe = config.unsafe ? config.unsafe : false;
  // modified for support IF NOT EXISTS
  query +=
    config.name +
    (config.ifnotexist === true ? " IF NOT EXISTS " : "") +
    " " +
    config.type;

  if (config.linkedClass || config.linkedType) {
    query += " " + (config.linkedClass || config.linkedType);
    delete config.linkedClass;
    delete config.linkedType;
  }

  // modified for support unsafe
  query += config.unsafe === true ? " UNSAFE " : "";

  return this.db
    .command(query)
    .all()
    .bind(this)
    .then(function() {
      var total = Object.keys(config).length;
      if (total === 2) {
        // only name and type are set,
        // we can avoid the update
        return reload ? this.reload() : this;
      } else {
        delete config.type;
        return this.property.update(config, reload);
      }
    })
    .then(function() {
      return this.property.get(config.name);
    });
};

exports.update = function(property, reload) {
  var promises = [],
    prefix = "ALTER PROPERTY " + this.name + "." + property.name + " ",
    keys,
    total,
    key,
    i;

  if (reload == null) {
    reload = true;
  }

  if (property.linkedClass !== undefined) {
    promises.push(
      this.db.command(prefix + "LINKEDCLASS " + property.linkedClass).all()
    );
  }
  if (property.linkedType !== undefined) {
    promises.push(
      this.db.command(prefix + "LINKEDTYPE " + property.linkedType).all()
    );
  }
  if (property.min !== undefined) {
    promises.push(this.db.command(prefix + "MIN " + property.min).all());
  }
  if (property.max !== undefined) {
    promises.push(this.db.command(prefix + "MAX " + property.max).all());
  }
  if (property.regexp !== undefined) {
    promises.push(this.db.command(prefix + "REGEXP " + property.regexp).all());
  }
  if (property.type !== undefined) {
    promises.push(this.db.command(prefix + "TYPE " + property.type).all());
  }
  if (property.readonly !== undefined) {
    promises.push(
      this.db
        .command(prefix + "READONLY " + (property.readonly ? "true" : "false"))
        .all()
    );
  }
  if (property.mandatory !== undefined) {
    promises.push(
      this.db
        .command(
          prefix + "MANDATORY " + (property.mandatory ? "true" : "false")
        )
        .all()
    );
  }
  if (property.notNull !== undefined) {
    promises.push(
      this.db.command(
        prefix + "NOTNULL " + (property.notNull ? "true" : "false")
      ).all()
    );
  }
  if (property.default !== undefined) {
    promises.push(
      this.db.command(prefix + "DEFAULT " + property.default).all()
    );
  }

  if (property.custom) {
    keys = Object.keys(property.custom);
    total = keys.length;
    for (i = 0; i < total; i++) {
      key = keys[i];
      promises.push(
        this.db
          .command(prefix + "CUSTOM " + key + " = " + property.custom[key])
          .all()
      );
    }
  }

  return Promise.all(promises)
    .bind(this)
    .then(function() {
      if (reload) {
        return this.reload();
      }
    })
    .then(function() {
      return this.property.get(property.name);
    });
};

/**
 * Drop the given property.
 *
 * @param   {String} name The property name.
 * @param  {Object} config The config.
 * @promise {Class}       The class instance with property removed.
 */
exports.drop = function(name, config) {
  config = config || {};
  config.ifexist = config.ifexist ? config.ifexist : false;
  config.force = config.force ? config.force : false;
  var query = "DROP PROPERTY " + this.name + "." + name;

  // modified for support IF NOT EXISTS and FORCE
  query +=
    (config.ifexist === true ? " IF  EXISTS " : "") +
    " " +
    (config.force === true ? " FORCE " : "");

  return this.db
    .command(query)
    .all()
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
exports.alter = function(name, setting) {
  return this.db
    .command("ALTER PROPERTY " + this.name + "." + name + " " + setting)
    .all()
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
exports.rename = function(oldName, newName) {
  return this.db
    .command("ALTER PROPERTY " + this.name + "." + oldName + " NAME " + newName)
    .all()
    .bind(this)
    .then(this.reload)
    .then(function() {
      return this.property.get(newName);
    });
};

/**
 * Get the property with the given name.
 *
 * @param   {String} name   The property to get.
 * @promise {Object|null}   The retrieved property.
 */
exports.get = function(name) {
  var total = this.properties.length,
    i,
    item;
  for (i = 0; i < total; i++) {
    item = this.properties[i];
    if (item.name === name) {
      return Promise.resolve(item);
    }
  }

  return Promise.resolve(null);
};
