describe.only('JWT', function () {
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
  describe('Server::connect()', function () {
    it('should connect to the server using a JWT', function () {
      return server.list()
      .then(function (result) {
        var db = server.use('testdb_bug_110');
        return db.select().from('OUser').token('12345678').all();
      })
      .then(function (result) {
        console.log(result);
      });
    });
  });
});