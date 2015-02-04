describe("Bug #238: Request hangs when attempting connection with invalid credentials", function () {
  var serverValid, serverInvalid;
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_238')
    .bind(this)
    .then(function () {
      serverValid = new LIB.Server({
        host: TEST_SERVER_CONFIG.host,
        port: TEST_SERVER_CONFIG.port,
        username: TEST_SERVER_CONFIG.username,
        password: TEST_SERVER_CONFIG.password,
        transport: 'binary'
      });

      serverInvalid = new LIB.Server({
        host: TEST_SERVER_CONFIG.host,
        port: TEST_SERVER_CONFIG.port,
        username: 'nonononono',
        password: 'nopenopenopenopenope',
        transport: 'binary'
      });
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_238');
  });

  it('should connect to the database with valid credentials', function () {
    return serverValid.use('testdb_bug_238').open()
    .then(function (db) {
      db.name.should.equal('testdb_bug_238');
    });
  });

  it('should fail to open a database with invalid server credentials', function () {
    var db = serverInvalid.use('testdb_bug_238');

    return db.open()
    .then(function (data) {
      throw new Error('should never happen.');
    })
    .catch(LIB.errors.RequestError, function (err) {
      err.message.should.match(/password/i);
    });
  });

  it('should fail to open a database with invalid database credentials', function () {
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