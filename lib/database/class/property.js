/*jshint esversion: 6 */
"use strict";

const Property = require('../../db/class/property');
const Promise = require('bluebird');


class DatabaseProperty extends Property {

  constructor(cfg) {
    super(cfg);
  }


  create(config, reload) {

  }
}


module.exports = exports = DatabaseProperty;


// Inherit from db/class

Object.keys(Property).forEach((k) => {
  exports[k] = Property[k];
});


/**
 * Create a new property.
 *
 * @param  {String|Object} config The property name or configuration.
 * @param   {Boolean} reload      Whether to reload the property, default to true.
 * @promise {Object}              The created property.
 */
exports.create = function (config, reload) {
  if (reload == null) {
    reload = true;
  }

  if (Array.isArray(config)) {

    return Promise.all(config.map(function (item) {
      return this.property.create(item, false);
    }, this))
      .bind(this)
      .then(function (results) {
        if (reload) {
          return this.reload();
        }
        else {
          return this;
        }
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
  config.ifnotexist = config.ifnotexist ? config.ifnotexist : false;
  config.unsafe = config.unsafe ? config.unsafe : false;
  // modified for support IF NOT EXISTS
  query += config.name + (config.ifnotexist === true ? " IF NOT EXISTS " : "") + ' ' + config.type;

  if (config.linkedClass || config.linkedType) {
    query += ' ' + (config.linkedClass || config.linkedType);
    delete config.linkedClass;
    delete config.linkedType;
  }


// modified for support unsafe
  query += (config.unsafe === true ? " UNSAFE " : "");


  return this.db.command(query).all()
    .bind(this)
    .then(function () {
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