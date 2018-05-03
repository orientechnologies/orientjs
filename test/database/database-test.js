var Promise = require('bluebird');
var should = require('should');



var assertPool = function() {
  TEST_CLIENT.cluster.servers[0].network.pool.size().should.be.above(0);
  TEST_CLIENT.cluster.servers[0].network.pool.borrowed().should.be.eql(0)
  TEST_CLIENT.cluster.servers[0].network.pool.pending().should.be.eql(0)
}
describe("ODatabase API - Open / Simple Query", function () {
  before(CAN_RUN(37, function () {
    return CREATE_DB("test_session");

  }));
  after(function () {
    return DROP_DB("test_session");
  });




  it('it should open/close a session', function () {
    return TEST_CLIENT.open({name: "test_session"})
      .then((db) => {
        db.session().sessionId.should.be.above(-1);
        return db.close();
      }).then((db) => {
        should.not.exists(db.session());
        assertPool();
      })
  })

  describe('Database::query()', function () {

    before(function () {
      return TEST_CLIENT.open({name: "test_session"})
        .then((db) => {
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
          assertPool();
        });
    });
    it('should execute a simple query with a limit', function () {
      return this.db.query('SELECT * FROM OUser LIMIT 1').all()
        .then(function (response) {
          response.length.should.equal(1);
          assertPool();
        });
    });
    it('should execute a simple query with a limit and a condition', function () {
      return this.db.query('SELECT * FROM OUser WHERE name = \'reader\'LIMIT 1').all()
        .then(function (response) {
          response.length.should.equal(1);
          assertPool();
        });
    });
    it('should execute a simple query with a limit and a condition that fails', function () {
      return this.db.query('SELECT * FROM OUser WHERE name = \'not_an_existing_user\'LIMIT 1').all()
        .then(function (response) {
          response.length.should.equal(0);
          assertPool();
        });
    });
    it('should execute a numerical parameterized query', function () {
      return this.db.query('SELECT * FROM OUser WHERE name = ? LIMIT 1', {
        params: ['reader']
      }).all()
        .then(function (response) {
          response.length.should.equal(1);
          response[0].name.should.equal('reader');
          assertPool();
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
          assertPool();
        });
    });
  });

});
