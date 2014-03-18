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
  if (config) this.configure(config);
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
 * List all the available migrations.
 *
 * @promise {String[]} The available migrations
 */
MigrationManager.prototype.listAvailable = function () {
  return fs.readdirAsync(this.dir)
  .bind(this)
  .filter(function (filename) {
    return /^m(\d+)_(\d+)\_(.*)\.js$/.test(filename);
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
 * @promise {Mixed} The result of the migration.
 */
MigrationManager.prototype.up = function () {
  return Promise.reject(new errors.Operation('MigrationManager "' + this.name + '" does not support up()'));
};


/**
 * Revert the migration.
 *
 * @promise {Mixed} The result of the migration.
 */
MigrationManager.prototype.down = function () {
  return Promise.reject(new errors.Operation('MigrationManager "' + this.name + '" does not support down()'));
};

