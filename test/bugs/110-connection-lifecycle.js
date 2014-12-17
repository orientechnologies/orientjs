var Statement = require('../../lib/db/statement');

describe("Bug #110: Connection lifecycle", function () {
  var server, db;
  before(function () {
    server = new LIB.Server({
      host: TEST_SERVER_CONFIG.host,
      port: TEST_SERVER_CONFIG.port,
      username: TEST_SERVER_CONFIG.username,
      password: TEST_SERVER_CONFIG.password,
      transport: 'binary',
      useToken: false
    });
    db = server.use('testdb_bug_110');
    return CREATE_TEST_DB(this, 'testdb_bug_110')
    .then(function () {
      return db.select().from('OUser').limit(1).one(); // ensure the connection is established.
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_110');
  });
  it('should not crash if the connection is interrupted', function () {
    var promise = db.class.list();
    db.server.transport.connection.socket.emit('error', {errnum: 100, message: 'ENETDOWN'});
    var counter = 0;
    return promise
    .then(function (results) {
      throw new Error('Should never happen!');
    })
    .error(function (err) {
      counter++;
    })
    .bind(this)
    .then(function () {
      counter++;
      return db.record.get('#5:0');
    })
    .then(function (rec) {
      counter++;
      var promise = db.record.get('#5:1');
      db.server.transport.connection.socket.emit('error', {errnum: 104, message: 'ECONNRESET'});
      return promise;
    })
    .then(function () {
      throw new Error('Should never happen!');
    })
    .error(function (err) {
      counter++;
    })
    .finally(function () {
      counter.should.equal(4);
    });
  });
  it('should close the database connection', function () {
    return db.close()
    .bind(this)
    .then(function () {
      return db.record.get('#5:0');
    })
    .then(function () {
      throw new Error("Should never happen.");
    })
    .error(function (err) {
      return db.record.get('#5:0');
    })
    .then(function (rec) {
      (''+rec['@rid']).should.equal('#5:0');
    });
  });
});