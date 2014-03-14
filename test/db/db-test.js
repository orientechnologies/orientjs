describe("Database API", function () {
  before(function (done) {
    TEST_SERVER.create({
      name: 'testdb_dbapi',
      type: 'document',
      storage: 'memory'
    })
    .bind(this)
    .then(function (db) {
      this.db = db;
      done();
    }, done)
    .done();
  });
  after(function (done) {
    TEST_SERVER.delete({
      name: 'testdb_dbapi',
      storage: 'memory'
    })
    .bind(this)
    .then(function (db) {
      done();
    }, done)
    .done();
  });

  describe('Db::open()', function () {
    it('should open the database', function (done) {
      this.db.open()
      .then(function (db) {
        db.sessionId.should.be.above(-1);
        done();
      }, done).done();
    });
  });
});