// test bootstrap

var Promise = require('bluebird'),
  path = require('path');

Promise.longStackTraces();

global.expect = require('expect.js'),
  global.should = require('should');


global.TEST_SERVER_CONFIG = require('./test-server.json');
global.TEST_DB_CONFIG = require('./test-db.json');


var host = process.env.ORIENTDB_HOST;
var binPort = process.env.ORIENTDB_BIN_PORT;
var httpPort = process.env.ORIENTDB_HTTP_PORT;

if (host) {
  global.TEST_SERVER_CONFIG.host = host;
  global.TEST_DB_CONFIG.host = host;
}
if (binPort) {
  binPort = parseInt(binPort);
  global.TEST_SERVER_CONFIG.port = binPort;
  global.TEST_DB_CONFIG.port = binPort;
}
if (httpPort) {
  httpPort = parseInt(httpPort);
  global.TEST_SERVER_CONFIG.httpPort = httpPort;
  global.TEST_DB_CONFIG.httpPort = httpPort;
}


global.LIB_ROOT = path.resolve(__dirname, '..', 'lib');

global.LIB = require(LIB_ROOT);

global.NETWORK = require('../lib/network/index');

global.CLIENT = require('../lib/client');


global.TEST_SERVER = new LIB.Server({
  host: TEST_SERVER_CONFIG.host,
  port: TEST_SERVER_CONFIG.port,
  username: TEST_SERVER_CONFIG.username,
  password: TEST_SERVER_CONFIG.password,
  transport: 'binary',
});


global.TEST_CLIENT = new global.CLIENT(Object.assign({}, TEST_SERVER_CONFIG, {
  pool: {
    acquireTimeoutMillis: 500
  }
}));

global.TEST_CLIENT.connect();


global.BINARY_TEST_SERVER = new LIB.Server({
  host: TEST_SERVER_CONFIG.host,
  port: TEST_SERVER_CONFIG.port,
  username: TEST_SERVER_CONFIG.username,
  password: TEST_SERVER_CONFIG.password,
  transport: 'binary',
});
global.POOL_TEST_SERVER = new LIB.Server({
  host: TEST_SERVER_CONFIG.host,
  port: TEST_SERVER_CONFIG.port,
  username: TEST_SERVER_CONFIG.username,
  password: TEST_SERVER_CONFIG.password,
  transport: 'binary',
  pool: {
    "max": 2
  }
});

global.BINARY_TEST_SERVER = new LIB.Server({
  host: TEST_SERVER_CONFIG.host,
  port: TEST_SERVER_CONFIG.port,
  username: TEST_SERVER_CONFIG.username,
  password: TEST_SERVER_CONFIG.password,
  transport: 'binary',
});
global.DISTRIBUTED_TEST_SERVER = new LIB.Server({
  host: TEST_SERVER_CONFIG.host,
  port: TEST_SERVER_CONFIG.port,
  username: TEST_SERVER_CONFIG.username,
  password: TEST_SERVER_CONFIG.password,
  transport: 'binary',
  servers: [{host: TEST_SERVER_CONFIG.host, port: TEST_SERVER_CONFIG.port - 1}, {
    host: TEST_SERVER_CONFIG.host,
    port: TEST_SERVER_CONFIG.port + 1
  }]
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

global.USE_DISTRIBUTED_TEST_DB = useTestDb.bind(null, DISTRIBUTED_TEST_SERVER);
global.CREATE_DISTRIBUTED_TEST_DB = createTestDb.bind(null, DISTRIBUTED_TEST_SERVER);
global.DELETE_DISTRIBUTED_TEST_DB = deleteTestDb.bind(null, DISTRIBUTED_TEST_SERVER);

global.CREATE_TEST_DB = createTestDb.bind(null, TEST_SERVER);
global.DELETE_TEST_DB = deleteTestDb.bind(null, TEST_SERVER);
global.CREATE_POOL = createPool.bind(null, TEST_SERVER);
global.USE_ODB = useOdb.bind(null, TEST_SERVER);
global.USE_TOKEN_DB = useOdbWithToken.bind(null, TEST_SERVER);


// new global for testing the new API
global.CREATE_DB = createDB.bind(null, TEST_CLIENT);
global.DROP_DB = dropDB.bind(null, TEST_CLIENT);

function createDB(client, name, type) {
  type = type || 'memory';
  var username = TEST_SERVER_CONFIG.username;
  var password = TEST_SERVER_CONFIG.password;
  var cfg = {
    name: name,
    storage: type
  }
  return client.exists(username, password, cfg)
    .then((exists) => {
      if (exists) {
        return client.drop(username, password, cfg);
      }
      return false;
    })
    .then(() => {
      return client.create(username, password, cfg);
    })
}

function dropDB(client, name, type) {
  type = type || 'memory';
  var username = TEST_SERVER_CONFIG.username;
  var password = TEST_SERVER_CONFIG.password;
  var cfg = {
    name: name,
    storage: type
  }
  return client.exists(username, password, cfg)
    .then((exists) => {
      if (exists) {
        return client.drop(username, password, cfg);
      }
      return undefined;
    })
    .then(() => {
      return undefined;
    })
}

global.CREATE_REST_DB = createTestDb.bind(null, REST_SERVER);
global.DELETE_REST_DB = deleteTestDb.bind(null, REST_SERVER);


function toInt(v) {

  var val = -1;
  try {
    val = parseInt(v);
  } catch (e) {
  }
  return val;
}
function checkVersion(current, target) {

  if (current && target) {

    var cVer = current.split(".").map(toInt);
    var tVer = target.split(".").map(toInt);
    if (cVer[0] >= tVer[0] && cVer[1] >= tVer[1] && cVer[2] >= tVer[2]) {
      return true;
    }
  }
  return false;
}
global.IF_ORIENTDB_MAJOR = function (ver, text, fn) {
  it(text, function () {
    if (checkVersion(this.db.release, ver)) {
      return fn.call(this);
    } else {
      console.log('        skipping, "' + text + '": operation not supported by OrientDB version');
    }

  });
}

function useTestDb(server, context, name) {
  return server.use(name).open().then(function (db) {
    context.db = db;
  })
}

function useOdb(server, name) {

  return new global.LIB.ODatabase({
    host: TEST_DB_CONFIG.host,
    port: TEST_DB_CONFIG.port,
    username: TEST_DB_CONFIG.username,
    password: TEST_DB_CONFIG.password,
    name: name
  })

  //context.pool.config.server.logger.debug = console.log.bind(console, '[ORIENTDB]');
}

function useOdbWithToken(server, name) {

  return new global.LIB.ODatabase({
    host: TEST_DB_CONFIG.host,
    port: TEST_DB_CONFIG.port,
    username: TEST_DB_CONFIG.username,
    password: TEST_DB_CONFIG.password,
    name: name,
    useToken: true
  })

  //context.pool.config.server.logger.debug = console.log.bind(console, '[ORIENTDB]');
}
function createPool(server, context, name) {
  context.pool = new global.LIB.Pool({
    host: TEST_DB_CONFIG.host,
    port: TEST_DB_CONFIG.port,
    username: TEST_DB_CONFIG.username,
    password: TEST_DB_CONFIG.password,
    name: name
  })

  //context.pool.config.server.logger.debug = console.log.bind(console, '[ORIENTDB]');
}
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

function deleteTestDb(server, name, type) {
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
