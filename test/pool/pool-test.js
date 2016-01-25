var Promise = require('bluebird');

describe("Pool API - Create", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'pool_test')
      .bind(this)
      .then(function () {
        return CREATE_POOL(this, 'pool_test');
      })

  });
  after(function () {
    return DELETE_TEST_DB('pool_test');
  });

  it('should release the db ', function () {
    var pool = this.pool;
    pool.getPoolSize().should.eql(0)
    return this.pool.acquire().then(function (db) {
      pool.getAvailableResources().should.eql(0);
      pool.release(db);
      pool.getAvailableResources().should.eql(1);
    });
  });
  it('should get all the dbs from the pool ', function () {
    var pool = this.pool;
    var size = pool.getMaxPoolSize();
    var promises = [];
    for (var i = 0; i < size; i++) {
      promises.push(pool.acquire());
    }
    return Promise.all(promises).then(function (dbs) {
      pool.getPoolSize().should.eql(size);
      pool.getAvailableResources().should.eql(0);

      dbs.forEach(function (db) {
        pool.release(db);
      });
      pool.getAvailableResources().should.eql(size);
    })
  });
  it('should return 3 OUser with pooled db', function () {
    var pool = this.pool;
    return this.pool.acquire().then(function (db) {
      var query = db.select().from('OUser');
      return query.all()
        .then(function (res) {
          res.length.should.eql(3);
          pool.release(db);

        })
        .then(function () {
          var size = pool.getMaxPoolSize();
          pool.getPoolSize().should.eql(size);
        })
    });
  });
  it('should close the pooled db', function () {
    var pool = this.pool;

    return this.pool.close().then(function () {
      pool.getPoolSize().should.eql(0);
    })
  });

});
