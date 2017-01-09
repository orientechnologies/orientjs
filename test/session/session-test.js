var Promise = require('bluebird');

describe("Session API", function () {
  before(function () {
    return CREATE_DB("test_session");

  });
  after(function () {
    return DROP_DB("test_session");
  });


  it('it should open/close a session', function () {
    return TEST_CLIENT.open({name: "test_session"})
      .then((session) => {
        session.sessionId.should.be.above(-1);
        return session.close();
      }).then((session) => {
        session.sessionId.should.be.eql(-1);
      })
  })

});
