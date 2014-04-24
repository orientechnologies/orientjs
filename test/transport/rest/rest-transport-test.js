var errors = LIB.errors;
describe("Rest Transport", function () {
  describe('RestTransport::send()', function  () {
    it("should handle errors correctly", function () {
      return REST_SERVER.transport.send('db-open', {
        name: 'not_an_existing_database',
        type: 'graph',
        username: 'admin',
        password: 'admin'
      })
      .then(function (response) {
        throw new Error('Should Not Happen!');
      })
      .catch(errors.Request, function (e) {
        e.message.should.equal('Authorization Error');
        return true;
      });
    })
  });
});