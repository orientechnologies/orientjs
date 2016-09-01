describe("Bug #198: Database with pooled connection", function () {
  var server, db;
  before(function () {
    server = new LIB.Server({
      host: TEST_SERVER_CONFIG.host,
      port: TEST_SERVER_CONFIG.port,
      username: 'nope',
      password: 'nope',
      transport: 'binary',
      // does not work with false + connec
      useToken: true,
      pool: {
        max: 5
      }
    });
    return CREATE_TEST_DB(this, 'testdb_bug_198')
      .then(function () {
        db = server.use({
          name: 'testdb_bug_198',
          username: 'admin',
          password: 'admin'
        });
        return db.open();
      });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_198');
  });
  it('should not hang with a faulty query ', function () {
    return db.query('select from Ozz')
      .then(function () {
        throw new Error('Should never happen!');
      })
      .catch(function (e) {
        return db.select().from('OUser').all()
          .then(function (results) {
            results.length.should.be.above(0);
          });
      })
  });
});