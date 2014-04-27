"use strict";

/**
 * Get a configuration value from the server.
 *
 * @param   {String} key The configuration key to get.
 * @promise {String}     The configuration value.
 */
exports.get = function (key) {
  return this.send('config-get', {
    key: key
  })
  .then(function (response) {
    return response.value;
  });
};

/**
 * Set a configuration value on the server.
 *
 * @param   {String} key   The configuration key to set.
 * @param   {String} value The new value.
 * @promise {String}       The configuration value.
 */
exports.set = function (key, value) {
  return this.send('config-set', {
    key: ''+key,
    value: ''+value
  })
  .then(function (response) {
    return value;
  });
};

/**
 * List the configuration for the server.
 *
 * @promise {Object} The configuration object.
 */
exports.list = function () {
  return this.send('config-list')
  .then(function (response) {
    var config = {},
        i;
    for (i = 0; i < response.total; i++) {
      config[response.items[i].key] = response.items[i].value;
    }
    return config;
  });
};
