describe("Database API", function () {
  before(function (done) {
    TEST_SERVER.create({
      name: 'testdb_dbapi',
      type: 'graph',
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

  describe('Db::query()', function () {
    it('should execute a simple query', function (done) {
      this.db.query('SELECT * FROM OUser')
      .then(function (response) {
        response.content.length.should.be.above(1);
        done();
      }, done).done();
    });
    it('should execute a simple query with a limit', function (done) {
      this.db.query('SELECT * FROM OUser LIMIT 1')
      .then(function (response) {
        response.content.length.should.equal(1);
        done();
      }, done).done();
    });
    it('should execute a simple query with a limit and a condition', function (done) {
      this.db.query('SELECT * FROM OUser WHERE name = \'reader\'LIMIT 1')
      .then(function (response) {
        response.content.length.should.equal(1);
        done();
      }, done).done();
    });
    it('should execute a simple query with a limit and a condition that fails', function (done) {
      this.db.query('SELECT * FROM OUser WHERE name = \'not_an_existing_user\'LIMIT 1')
      .then(function (response) {
        response.content.length.should.equal(0);
        done();
      }, done).done();
    });
    it('should execute a numerical parameterized query', function (done) {
      this.db.query('SELECT * FROM OUser WHERE name = ? LIMIT 1', {
        params: ['reader']
      })
      .then(function (response) {
        response.content.length.should.equal(1);
        response.content[0].value.name.should.equal('reader');
        done();
      }, done).done();
    });
    it('should execute a named parameterized query', function (done) {
      this.db.query('SELECT * FROM OUser WHERE name = :name LIMIT 1', {
        params: {
          name: 'writer'
        }
      })
      .then(function (response) {
        response.content.length.should.equal(1);
        response.content[0].value.name.should.equal('writer');
        done();
      }, done).done();
    });
  });
});