var Promise = require('bluebird');

var Errors = require('../../lib/errors');

describe("Database Pool API", function () {
  before(CAN_RUN(37, function () {
    return CREATE_DB("test_session_pool");

  }));
  after(function () {
    return DROP_DB("test_session_pool");
  });


  it('it should open/acquire/close a pool', function () {
    return TEST_CLIENT.openPool({name: "test_session_pool"})
      .then((pool) => {
        this.pool = pool;
        return this.pool.acquire();
      }).then((db) => {
        db.session().sessionId.should.not.be.eql(-1);
        return db.close();
      }).then(() => {
        return this.pool.close();
      }).then((closed) => {
        // ensure minimum = 2
        closed.length.should.equal(2);
      })
  })

  describe('ODatabasePool::acquire/release', function () {

    before(function () {
      return TEST_CLIENT.openPool({name: "test_session_pool", pool: {min: 1, max: 2, acquireTimeoutMillis: 200}})
        .then((pool) => {
          this.pool = pool;
        })
    });
    after(function () {
      return this.pool.close();
    });
    it('should acquire/release a session', function () {
      return this.pool.acquire()
        .then((db) => {
          db.session().sessionId.should.not.be.eql(-1);
          return this.pool.release(db);
        }).then(() => {
          this.pool.available().should.be.eql(1);
        });
    })
    it('should fail to acquire a session', function () {

      var dbs = [this.pool.acquire(), this.pool.acquire()];
      return Promise.all(dbs)
        .then((dbs) => {
          dbs.length.should.be.eql(2);
          this.dbs = dbs;
          return this.pool.acquire();
        }).then(() => {
          throw new Error('Should never happen!');
        }).catch((err) => {
          err.should.be.an.instanceOf(Errors.DatabaseError);
          return Promise.all(this.dbs.map((s) => s.close()))
        });
    })
  });

});
