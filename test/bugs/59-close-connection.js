describe("Bug #59: hang on closing server connection", function () {
  it('should close the server connection correctly', function () {
    var server = new LIB.Server({
      host: TEST_SERVER_CONFIG.host,
      port: TEST_SERVER_CONFIG.port,
      username: TEST_SERVER_CONFIG.username,
      password: TEST_SERVER_CONFIG.password,
      transport: 'binary'
    });

    var db = server.use('GratefulDeadConcerts');

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