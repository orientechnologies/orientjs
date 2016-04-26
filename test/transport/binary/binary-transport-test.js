var errors = LIB.errors;
describe("Binary Transport", function () {
  describe('BinaryTransport::connect()', function () {
    it("should negotiate a connection", function () {
      return BINARY_TEST_SERVER.transport.connect()
      .then(function (server) {
        server.sessionId.should.be.above(-1);
      });
    });
  });
  describe('BinaryTransport::send()', function  () {
    it("should handle errors correctly", function () {
      return BINARY_TEST_SERVER.transport.send('db-open', {
        name: 'not_an_existing_database',
        type: 'graph',
        username: 'admin',
        password: 'admin'
      })
      .then(function (response) {
        throw new Error('Should Not Happen!');
      })
      .catch(errors.Request, function (e) {
        e.type.should.equal('com.orientechnologies.orient.core.exception.OConfigurationException');
        return true;
      });
    })
  });
});