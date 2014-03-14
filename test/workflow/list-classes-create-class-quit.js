describe("List classes, create class, quit", function () {
  before(function (done) {
    CREATE_TEST_DB(this, 'testdb_dbapi_workflow1')
    .then(done, done)
    .done();
  });
  after(function (done) {
    DELETE_TEST_DB('testdb_dbapi_workflow1')
    .then(done, done)
    .done();
  });
  it('should list the classes', function (done) {
    this.db.class.list()
    .then(function (results) {
      results.length.should.be.above(1);
      done();
    }, done).done();
  });
  it('should create a new class', function (done) {
    this.db.class.create('TestClass')
    .then(function (obj) {
      obj.name.should.equal('TestClass');
      done();
    }, done).done();
  })
});