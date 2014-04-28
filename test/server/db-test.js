describe("Database commands", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'test_db_commands', 'plocal')
      .bind(this)
      .then(function (db) {
      this.db = db;
    });
  });
  after(function () {
    return DELETE_TEST_DB('test_db_commands');
  });
  describe('Server::freeze()', function () {
    it("should freeze", function (done) {
      TEST_SERVER.freeze("test_db_commands", "plocal")
      .then(function (response) {
        response.should.be.true;
        done();
      }, done).done();
    });
    it("should allow only read-only operations", function(){
      return this.db.record.create({
        '@class': 'OUser',
        name: 'testuserx',
        password: 'testpasswordx',
        status: 'ACTIVE'
      }).bind(this)
      .then(function (record) {
        //@TODO implement assertion
        //Should this be null ? 
        createdRID = record['@rid'];
        return this.db.record.delete(createdRID);
      });
 
    });
  });
  describe('Server::release()', function () {
    it("should release", function (done) {
      TEST_SERVER.release("test_db_commands", "plocal")
      .then(function (response) {
        response.should.be.true;
        done();
      }, done).done();
    });
  });


});
