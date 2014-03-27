// test bootstrap

var Promise = require('bluebird');
Promise.longStackTraces();

global.expect = require('expect.js'),
global.should = require('should');


global.TEST_SERVER_CONFIG = require('./test-server.json');

global.LIB = require('../lib');

global.TEST_SERVER = new LIB.Server(TEST_SERVER_CONFIG);

// Uncomment the following line to enable debug logging
// global.TEST_SERVER.logger.debug = console.log.bind(console, '[ORIENTDB]');


global.CREATE_TEST_DB = function (context, name) {
  return TEST_SERVER.exists(name, 'memory')
  .then(function (exists) {
    if (exists) {
      return TEST_SERVER.delete({
        name: name,
        storage: 'memory'
      });
    }
    else {
      return false;
    }
  })
  .then(function () {
    return TEST_SERVER.create({
      name: name,
      type: 'graph',
      storage: 'memory'
    });
  })
  .then(function (db) {
     context.db = db;
     return undefined;
  });
};

global.DELETE_TEST_DB = function (name) {
  return TEST_SERVER.exists(name, 'memory')
  .then(function (exists) {
    if (exists) {
      return TEST_SERVER.delete({
        name: name,
        storage: 'memory'
      });
    }
    else {
      return undefined;
    }
  })
  .then(function () {
    return undefined;
  });
};