var errors = LIB.errors;
describe("Server", function () {
  describe('Server::create()', function () {
    it("should create a new database", function () {
      return TEST_SERVER.create({
        name: 'testdb_server',
        type: 'graph',
        storage: 'memory'
      })
      .then(function (db) {
        db.name.should.equal('testdb_server');
      });
    });
  });
  describe('Server::freeze()', function () {
    it("should freeze", function () {
      return TEST_SERVER.freeze("testdb_server")
      .then(function (response) {
        response.should.be.true;
      });
    });
  });
  describe('Server::release()', function () {
    it("should release", function () {
      return TEST_SERVER.release("testdb_server")
      .then(function (response) {
        response.should.be.true;
      });
    });
  });
  describe('Server::list()', function () {
    it("should list the existing databases", function () {
      return TEST_SERVER.list()
      .then(function (dbs) {
        dbs.length.should.be.above(0);
        dbs.forEach(function (db) {
          db.should.be.an.instanceOf(LIB.Db);
        });
      });
    });
  });
  describe('Server::exists()', function () {
    it("should confirm an existing database exists", function () {
      return TEST_SERVER.exists('testdb_server')
      .then(function (exists) {
        exists.should.be.true;
      });
    });
    it("should confirm a missing database does not exist", function () {
      return TEST_SERVER.exists('a_missing_database')
      .then(function (exists) {
        exists.should.be.false;
      });
    });
  });
  describe('Server::delete()', function () {
    it("should delete a database", function () {
      return TEST_SERVER.drop({
        name: 'testdb_server',
        type: 'graph',
        storage: 'memory'
      })
      .then(function (response) {
        response.should.be.true;
      });
    });
  });
  describe('Server::config.list', function () {
    it("should list the server config", function () {
      return TEST_SERVER.config.list()
      .then(function (config) {
        config.should.have.property('db.pool.min');
      });
    });
  });

  describe('Server::config.get', function () {
    it("should get a server config key", function () {
      return TEST_SERVER.config.get('db.pool.min')
      .then(function (value) {
        value.should.have.type('string');
      });
    });
  });
});
