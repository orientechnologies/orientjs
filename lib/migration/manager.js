"use strict";

var Promise = require('bluebird'),
    errors = require('../errors'),
    utils = require('../utils'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path');

/**
 * # Migration Manager
 *
 * @param {Object} config The configuration for the migration manager.
 */
function MigrationManager (config) {
  this.name = '';
  this.db = null;
  this.dir = process.cwd();
  this.className = 'Migration';
  if (config) {
    this.configure(config);
  }
}

MigrationManager.extend = utils.extend;

module.exports = MigrationManager;

/**
 * Configure the migration.
 *
 * @param  {Object}    config The configuration object.
 * @return {MigrationManager}        The migration instance.
 */
MigrationManager.prototype.configure = function (config) {
  var keys = Object.keys(config),
      total = keys.length,
      key, i;

  for (i = 0; i < total; i++) {
    key = keys[i];
    this[key] = config[key];
  }
  return this;
};

/**
 * Create a new migration.
 *
 * @param   {String|Object} config  The name or configuration for the new migration.
 * @promise {String}                The full path to the created migration.
 */
MigrationManager.prototype.create = function (config) {
  var prefix;
  if (typeof config === 'string') {
    config = {
      name: config,
      db: this.db ? this.db.name : null
    };
  }
  if (!config.name) {
    return Promise.reject(new errors.Operation('MigrationManager cannot create a migration without a name'));
  }

  prefix = 'm' + (new Date()).toJSON()
  .replace(/[-:Z]/g,'')
  .split('.')[0]
  .replace(/T/,'_');

  config.id = prefix + '_' + config.name.replace(/[^A-Za-z0-9]/g,'_').replace(/_+/g, '_');

  config.filename = path.join(this.dir, config.id + '.js');

  return fs.writeFileAsync(config.filename, this.generateMigration(config))
  .return(config.filename);
};


/**
 * Generate the content for a migration.
 * @param  {Object} config The configuration object.
 * @return {String}        The generated JavaScript source code.
 */
MigrationManager.prototype.generateMigration = function (config) {
  var content = 'exports.name = ' + JSON.stringify(config.name) + ';\n\n';
  content += 'exports.db = ' + JSON.stringify(config.db) + ';\n\n';
  content += 'exports.up = function (db) {\n  // @todo implementation\n};\n\n';
  content += 'exports.down = function (db) {\n  // @todo implementation\n};\n\n';
  return content;
};


/**
 * List the migrations that have not yet been applied.
 *
 * @promise {String[]} An array of migration names
 */
MigrationManager.prototype.list = function () {
  return this.ensureStructure()
  .bind(this)
  .then(function () {
    return Promise.all([
      this.listAvailable(),
      this.listApplied()
    ]);
  })
  .then(function (args) {
    var available = args[0],
        applied = args[1],
        pending = [],
        totalAvailable = available.length,
        totalApplied = applied.length,
        item, other, i, j, found;

    for (i = 0; i < totalAvailable; i++) {
      item = available[i];
      found = false;
      for (j = 0; j < totalApplied; j++) {
        other = applied[j];
        if (other.name === item) {
          found = true;
          break;
        }
      }
      if (!found) {
        pending.push(item);
      }
    }
    return pending;
  });
};

/**
 * List all the available migrations.
 *
 * @promise {String[]} The names of the available migrations.
 */
MigrationManager.prototype.listAvailable = function () {
  return fs.readdirAsync(this.dir)
  .bind(this)
  .filter(function (filename) {
    return /^m(\d+)_(\d+)\_(.*)\.js$/.test(filename);
  })
  .map(function (filename) {
    return filename.slice(0, -3);
  });
};

/**
 * Ensure the migration class exists.
 *
 * @promise {MigrationManager}  The manager instance with intact structure.
 */
MigrationManager.prototype.ensureStructure = function () {
  return this.db.class.get(this.className)
  .bind(this)
  .catch(errors.Request, function () {
    return this.db.class.create(this.className)
    .bind(this)
    .then(function (item) {
      return item.property.create([
        {
          name: 'id',
          type: 'String'
        },
        {
          name: 'appliedAt',
          stype: 'Date'
        }
      ]);
    });
  })
  .return(this);
};

/**
 * Retrieve a list of applied migrations.
 *
 * @promise {Object[]} The applied migrations.
 */
MigrationManager.prototype.listApplied = function () {
  return this.db.class.get(this.className)
  .bind(this)
  .then(function (migrations) {
    return migrations.list(Infinity);
  });
};


/**
 * Perform the migration.
 *
 * @param   {Integer} limit The maximum number of migrations to apply, if any.
 * @promise {Mixed} The result of the migration.
 */
MigrationManager.prototype.up = function (limit) {
  return this.list()
  .bind(this)
  .filter(function (item, index) {
    if (limit && index >= limit) {
      return false;
    }
    else {
      return true;
    }
  })
  .reduce(function (accumulator, name) {
    return this.applyMigration(name)
    .then(function (result) {
      accumulator.push(name);
      return accumulator;
    });
  }, []);
};


/**
 * Revert the migration.
 *
 * @param   {Integer} limit The maximum number of migrations to revert, if any.
 * @promise {Mixed} The result of the migration.
 */
MigrationManager.prototype.down = function (limit) {
  return this.listApplied()
  .bind(this)
  .map(function (item) {
    return item.name;
  })
  .then(function (items) {
    return items.reverse();
  })
  .filter(function (item, index) {
    if (limit && index >= limit) {
      return false;
    }
    else {
      return true;
    }
  })
  .reduce(function (accumulator, name) {
    return this.revertMigration(name)
    .then(function (result) {
      accumulator.push(name);
      return accumulator;
    });
  }, []);
};


/**
 * Load the migration with the given name.
 *
 * @param  {String}    name The name of the migation.
 * @return {Migration}      The loaded migration instance.
 */
MigrationManager.prototype.loadMigration = function (name) {
  var Migration = require('./index');
  return new Migration(require(path.join(this.dir, name)));
};

/**
 * Apply the migration with the given name.
 *
 * @param   {String} name The name of the migation.
 * @promise {Mixed} The result of the migration.
 */
MigrationManager.prototype.applyMigration = function (name) {
  var migration = this.loadMigration(name);
  return Promise.cast(migration.up(this.db))
  .bind(this)
  .then(function (result) {
    return this.db.class.get(this.className)
    .then(function (migrations) {
      return migrations.create({
        name: name,
        appliedAt: new Date()
      });
    })
    .return(result);
  });
};


/**
 * Revert the migration with the given name.
 *
 * @param   {String} name The name of the migation.
 * @promise {Mixed} The result of the migration.
 */
MigrationManager.prototype.revertMigration = function (name) {
  var migration = this.loadMigration(name);
  return Promise.cast(migration.down(this.db))
  .bind(this)
  .then(function (result) {
    return this.db.class.get(this.className)
    .bind(this)
    .then(function (migrations) {
      return migrations.find({name: name}, 1)
      .bind(this)
      .then(function (records) {
        return this.db.record.delete(records[0]);
      });
    })
    .return(result);
  });
};