describe("Bug #26: Issue while adding IP as a value to a Vertex", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_26')
    .bind(this)
    .then(function () {
      return this.db.class.create('Host');
    })
    .then(function (item) {
      this.class = item;
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_26');
  });

  it('should insert an IP into the database, using a dynamic field', function () {
    return this.db.insert().into('Host').set({ip: '127.0.0.1'}).one()
    .then(function (host) {
      host.ip.should.equal('127.0.0.1');
    })
  })
});