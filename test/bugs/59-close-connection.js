describe("Bug #59: hang on closing server connection", function () {
  var server;
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_59_close_connection')
    .bind(this)
    .then(function () {
      server = new LIB.Server({
        host: TEST_SERVER_CONFIG.host,
        port: TEST_SERVER_CONFIG.port,
        username: TEST_SERVER_CONFIG.username,
        password: TEST_SERVER_CONFIG.password,
        transport: 'binary'
      });
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_59_close_connection');
  });
  it('should close the server connection correctly', function () {

    var db = server.use('testdb_59_close_connection');

    return db.class.list()
    .then(function (classes) {
      classes.length.should.be.above(1);
      return server.close();
    })
    .then(function (server) {
      expect(server.transport.connection.socket).to.equal(null);
    });
  });
});