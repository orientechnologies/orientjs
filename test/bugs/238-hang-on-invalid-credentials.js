describe("Bug #238: Request hangs when attempting connection with invalid credentials", function () {
  var hasProtocolSupport = false,
    self = this,
    serverValid, serverInvalid;

  ////////////////////////////////////////////
  function ifSupportedIt(text, fn) {
    it(text, function () {
      if (hasProtocolSupport) {
        return fn.call(this);
      }
      else {
        console.log('        skipping, "' + text + '": operation not supported by OrientDB version');
      }
    });
  }

  function createTestDb(server, name, type) {
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
        self.db = db;
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

  function newValidServer() {
    return new LIB.Server({
      host: TEST_SERVER_CONFIG.host,
      port: TEST_SERVER_CONFIG.port,
      username: TEST_SERVER_CONFIG.username,
      password: TEST_SERVER_CONFIG.password,
      transport: 'binary',
      useToken: true
    });
  }

  ////////////////////////////////////////////

  before(function () {
    serverValid = newValidServer();

    return createTestDb(serverValid, 'testdb_bug_238')
      .then(function () {

        serverInvalid = new LIB.Server({
          host: TEST_SERVER_CONFIG.host,
          port: TEST_SERVER_CONFIG.port,
          username: 'nonononono',
          password: 'nopenopenopenopenope',
          transport: 'binary',
          useToken: true
        });

        hasProtocolSupport = self.db.server.transport.connection.protocolVersion >= 28;
      });
  });
  after(function () {
    return  deleteTestDb(serverValid, 'testdb_bug_238');
  });

  ifSupportedIt('should connect to the database with valid credentials', function () {
    return serverValid.use('testdb_bug_238').open()
      .then(function (db) {
        db.name.should.equal('testdb_bug_238');
        db.token.should.be.an.instanceOf(Buffer);
        db.token.length.should.be.above(0);
      });
  });

  ifSupportedIt('should fail to open a database with invalid server credentials', function () {
    var db = serverInvalid.use('testdb_bug_238');

    return db.open()
      .then(function (data) {
        throw new Error('should never happen.');
      })
      .catch(LIB.errors.RequestError, function (err) {
        err.message.should.match(/password/i);
      });
  });

  ifSupportedIt('should open a database with valid database credentials', function () {
    var db = serverValid.use({
      name: 'testdb_bug_238',
      username: 'reader',
      password: 'reader'
    });

    return db.open()
      .then(function (db) {
        db.token.length.should.be.above(0);
      });
  });

  ifSupportedIt('should fail to open a database with invalid database credentials', function () {

    var db = serverValid.use({
      name: 'testdb_bug_238',
      username: 'nonononono',
      password: 'nopenopenopenopenope'
    });

    return db.open()
      .then(function (data) {
        throw new Error('should never happen.');
      })
      .catch(LIB.errors.RequestError, function (err) {
        err.message.should.match(/password/i);
      });
  });
});
