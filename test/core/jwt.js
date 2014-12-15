describe.skip('JWT', function () {
  var server;
  before(function () {
    server = new LIB.Server({
      host: TEST_SERVER_CONFIG.host,
      port: TEST_SERVER_CONFIG.port,
      username: TEST_SERVER_CONFIG.username,
      password: TEST_SERVER_CONFIG.password,
      transport: 'binary',
      useToken: true
    });
  })
  describe.skip('JWT Server::connect()', function () {
    it('should connect to the server using a JWT', function () {
      var db;
      return server.list()
      .then(function (result) {
        db = server.use('jwt_test');
        return db.open();
      })
      .then(function (result) {
        console.log(result.token);
        return db.select().from('OUser').token('12345678').all();
      })
      .then(function (result) {
        console.log(result);
      });
    });
  });
});