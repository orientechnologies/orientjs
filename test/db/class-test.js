describe("Database API - Class", function () {
  before(function (done) {
    CREATE_TEST_DB(this, 'testdb_dbapi_class')
    .then(done, done)
    .done();
  });
  after(function (done) {
    DELETE_TEST_DB('testdb_dbapi_class')
    .then(done, done)
    .done();
  });
  describe('Db::class.list()', function () {
    it('should list the classes in the database', function (done) {
      this.db.class.list()
      .then(function (classes) {
        classes.length.should.be.above(0);
        done();
      }, done).done();
    });
  });

  describe('Db::class.get()', function () {
    it('should get the class with the given name', function (done) {
      this.db.class.get('OUser')
      .then(function (item) {
        item.name.should.equal('OUser');
        done();
      }, done).done();
    });
  });

  describe('Db::class.create()', function () {
    it('should create a class with the given name', function (done) {
      this.db.class.create('TestClass')
      .then(function (item) {
        item.name.should.equal('TestClass');
        done();
      }, done).done();
    });
  });

  describe('Db::class.delete()', function () {
    it('should delete a class with the given name', function (done) {
      this.db.class.delete('TestClass')
      .then(function (item) {
        done();
      }, done).done();
    });
  });


});