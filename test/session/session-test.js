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

  describe('Session::query()', function () {

    before(function () {
      return TEST_CLIENT.open({name: "test_session"})
        .then((session) => {
          this.session = session;
        })

    });
    after(function () {
      return this.session.close();
    });
    it('should execute a simple query', function () {
      return this.session.query('SELECT * FROM OUser')
        .then(function (response) {
          response.length.should.be.above(1);
        });
    });
    it('should execute a simple query with a limit', function () {
      return this.session.query('SELECT * FROM OUser LIMIT 1')
        .then(function (response) {
          response.length.should.equal(1);
        });
    });
    it('should execute a simple query with a limit and a condition', function () {
      return this.session.query('SELECT * FROM OUser WHERE name = \'reader\'LIMIT 1')
        .then(function (response) {
          response.length.should.equal(1);
        });
    });
    it('should execute a simple query with a limit and a condition that fails', function () {
      return this.session.query('SELECT * FROM OUser WHERE name = \'not_an_existing_user\'LIMIT 1')
        .then(function (response) {
          response.length.should.equal(0);
        });
    });
    it('should execute a numerical parameterized query', function () {
      return this.session.query('SELECT * FROM OUser WHERE name = ? LIMIT 1', {
        params: ['reader']
      })
        .then(function (response) {
          response.length.should.equal(1);
          response[0].name.should.equal('reader');
        });
    });
    it('should execute a named parameterized query', function () {
      return this.session.query('SELECT * FROM OUser WHERE name = :name LIMIT 1', {
        params: {
          name: 'writer'
        }
      })
        .then(function (response) {
          response.length.should.equal(1);
          response[0].name.should.equal('writer');
        });
    });
  });

});
