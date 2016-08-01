describe("Database commands", function () {
  this.timeout(30000);
  before(function () {
    return CREATE_TEST_DB(this, 'test_db_commands', 'plocal');
  });
  after(function () {
    return DELETE_TEST_DB('test_db_commands');
  });
  describe('Server::freeze()', function () {
    it("should freeze", function () {
      return TEST_SERVER.freeze("test_db_commands", "plocal")
      .then(function (response) {
        response.should.be.true;
      });
    });
    // Not valid anymore since the server does not throw exception. It just hangs the ops
    //it("should allow only read-only operations", function(){
    //  return this.db.record.create({
    //    '@class': 'OUser',
    //    name: 'testuser1',
    //    password: 'testpassword1',
    //    status: 'ACTIVE'
    //  })
    //  .bind(this)
    //  .then(function (record) {
    //    throw new Error('Should never happen!');
    //  })
    //  .catch(LIB.errors.Request, function (e) {
    //    return true;
    //  });
    //});
  });
  describe('Server::release()', function () {
    it("should release", function () {
      return TEST_SERVER.release("test_db_commands", "plocal")
      .then(function (response) {
        response.should.be.true;
      });
    });
    it("should allow record creation", function(){
      return this.db.record.create({
        '@class': 'OUser',
        name: 'testuser2',
        password: 'testpassword2',
        status: 'ACTIVE'
      })
      .bind(this)
      .then(function (record) {
        return true;
      })
      .catch(LIB.errors.Request, function (e) {
        throw new Error('Should never happen!');
      });
    });
  });
});
