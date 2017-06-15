var Promise = require('bluebird');

describe("ODatabase API - Open / Simple Query", function () {
  before(CAN_RUN(37, function () {
    return CREATE_DB("test_session");

  }));
  after(function () {
    return DROP_DB("test_session");
  });


  it('it should open/close a session', function () {
    return TEST_CLIENT.open({name: "test_session"})
      .then((session) => {
        db.sessionId.should.be.above(-1);
        return db.close();
      }).then((session) => {
        db.sessionId.should.be.eql(-1);
      })
  })

  describe('Database::query()', function () {

    before(function () {
      return TEST_CLIENT.open({name: "test_session"})
        .then((session) => {
          this.db = db;
        })

    });
    after(function () {
      return this.db.close();
    });
    it('should execute a simple query', function () {
      return this.db.query('SELECT * FROM OUser').all()
        .then(function (response) {
          response.length.should.be.above(1);
        });
    });
    it('should execute a simple query with a limit', function () {
      return this.db.query('SELECT * FROM OUser LIMIT 1').all()
        .then(function (response) {
          response.length.should.equal(1);
        });
    });
    it('should execute a simple query with a limit and a condition', function () {
      return this.db.query('SELECT * FROM OUser WHERE name = \'reader\'LIMIT 1').all()
        .then(function (response) {
          response.length.should.equal(1);
        });
    });
    it('should execute a simple query with a limit and a condition that fails', function () {
      return this.db.query('SELECT * FROM OUser WHERE name = \'not_an_existing_user\'LIMIT 1').all()
        .then(function (response) {
          response.length.should.equal(0);
        });
    });
    it('should execute a numerical parameterized query', function () {
      return this.db.query('SELECT * FROM OUser WHERE name = ? LIMIT 1', {
        params: ['reader']
      }).all()
        .then(function (response) {
          response.length.should.equal(1);
          response[0].name.should.equal('reader');
        });
    });
    it('should execute a named parameterized query', function () {
      return this.db.query('SELECT * FROM OUser WHERE name = :name LIMIT 1', {
        params: {
          name: 'writer'
        }
      }).all()
        .then(function (response) {
          response.length.should.equal(1);
          response[0].name.should.equal('writer');
        });
    });
  });

});
