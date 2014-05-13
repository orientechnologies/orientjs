// test bootstrap

var Promise = require('bluebird'),
    path = require('path');

Promise.longStackTraces();

global.expect = require('expect.js'),
global.should = require('should');


global.TEST_SERVER_CONFIG = require('./test-server.json');

global.LIB_ROOT = path.resolve(__dirname, '..', 'lib');

global.LIB = require(LIB_ROOT);


global.TEST_SERVER = new LIB.Server({
  host: TEST_SERVER_CONFIG.host,
  port: TEST_SERVER_CONFIG.port,
  username: TEST_SERVER_CONFIG.username,
  password: TEST_SERVER_CONFIG.password,
  transport: 'binary'
});

global.REST_SERVER = new LIB.Server({
  host: TEST_SERVER_CONFIG.host,
  port: TEST_SERVER_CONFIG.httpPort,
  username: TEST_SERVER_CONFIG.username,
  password: TEST_SERVER_CONFIG.password,
  transport: 'rest'
});

// Uncomment the following lines to enable debug logging
// global.TEST_SERVER.logger.debug = console.log.bind(console, '[ORIENTDB]');
// global.REST_SERVER.logger.debug = console.log.bind(console, '[ORIENTDB]');


global.CREATE_TEST_DB = createTestDb.bind(null, TEST_SERVER);
global.DELETE_TEST_DB = deleteTestDb.bind(null, TEST_SERVER);

global.CREATE_REST_DB = createTestDb.bind(null, REST_SERVER);
global.DELETE_REST_DB = deleteTestDb.bind(null, REST_SERVER);



function createTestDb(server, context, name, type) {
  type = type || 'memory';
  return server.exists(name, type)
  .then(function (exists) {
    if (exists) {
      return server.drop({
        name: name,
        storage: type
      });
    }
    else {
      return false;
    }
  })
  .then(function () {
    return server.create({
      name: name,
      type: 'graph',
      storage: type
    });
  })
  .then(function (db) {
     context.db = db;
     return undefined;
  });
}

function deleteTestDb (server, name, type) {
  type = type || 'memory';
  return server.exists(name, type)
  .then(function (exists) {
    if (exists) {
      return server.drop({
        name: name,
        storage: type
      });
    }
    else {
      return undefined;
    }
  })
  .then(function () {
    return undefined;
  });
}
