describe("List classes, create class, quit", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_workflow1');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_workflow1');
  });
  it('should list the classes', function () {
    return this.db.class.list()
    .then(function (results) {
      results.length.should.be.above(1);
    });
  });
  it('should create a new class', function () {
    return this.db.class.create('TestClass')
    .then(function (obj) {
      obj.name.should.equal('TestClass');
    });
  })
});