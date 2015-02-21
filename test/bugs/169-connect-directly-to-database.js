describe("Bug #169: Connect to db without server credentials", function () {
  var server, db;
  before(function () {
    server = new LIB.Server({
      host: TEST_SERVER_CONFIG.host,
      port: TEST_SERVER_CONFIG.port,
      username: 'nope',
      password: 'nope',
      transport: 'binary',
      useToken: false
    });    
    return CREATE_TEST_DB(this, 'testdb_bug_169')
    .then(function () {
      db = server.use({
        name: 'testdb_bug_169',
        username: 'admin',
        password: 'admin'
      });
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_169');
  });
  it('should connect to the database directly', function () {
    return db.select().from('OUser').all()
    .then(function (results) {
      results.length.should.be.above(0);
    });
  });
});
