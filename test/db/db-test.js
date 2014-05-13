describe("Database API", function () {
  before(function () {
    return TEST_SERVER.create({
      name: 'testdb_dbapi',
      type: 'graph',
      storage: 'memory'
    })
    .bind(this)
    .then(function (db) {
      this.db = db;
    });
  });
  after(function () {
    return TEST_SERVER.drop({
      name: 'testdb_dbapi',
      storage: 'memory'
    });
  });

  describe('Db::open()', function () {
    it('should open the database', function () {
      return this.db.open()
      .then(function (db) {
        db.sessionId.should.be.above(-1);
      });
    });
  });

  describe('Db::query()', function () {
    it('should execute a simple query', function () {
      return this.db.query('SELECT * FROM OUser')
      .then(function (response) {
        response.length.should.be.above(1);
      });
    });
    it('should execute a simple query with a limit', function () {
      return this.db.query('SELECT * FROM OUser LIMIT 1')
      .then(function (response) {
        response.length.should.equal(1);
      });
    });
    it('should execute a simple query with a limit and a condition', function () {
      return this.db.query('SELECT * FROM OUser WHERE name = \'reader\'LIMIT 1')
      .then(function (response) {
        response.length.should.equal(1);
      });
    });
    it('should execute a simple query with a limit and a condition that fails', function () {
      return this.db.query('SELECT * FROM OUser WHERE name = \'not_an_existing_user\'LIMIT 1')
      .then(function (response) {
        response.length.should.equal(0);
      });
    });
    it('should execute a numerical parameterized query', function () {
      return this.db.query('SELECT * FROM OUser WHERE name = ? LIMIT 1', {
        params: ['reader']
      })
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
      })
      .then(function (response) {
        response.length.should.equal(1);
        response[0].name.should.equal('writer');
      });
    });
  });
});