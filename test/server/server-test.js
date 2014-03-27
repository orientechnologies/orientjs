var errors = LIB.errors;


describe("Server", function () {
  describe('Server::connect()', function () {
    it("should negotiate a connection", function (done) {
      TEST_SERVER.connect()
      .then(function (server) {
        server.sessionId.should.be.above(-1);
        server.protocolVersion.should.be.above(18);
        done();
      }, done);
    });
  });
  describe('Server::send()', function  () {
    it("should handle errors correctly", function (done) {
      TEST_SERVER.send('db-open', {
        name: 'not_an_existing_database',
        type: 'graph',
        username: 'admin',
        password: 'admin'
      })
      .then(function (response) {
        done(new Error('Should Not Happen!'));
      })
      .catch(errors.Request, function (e) {
        e.type.should.equal('com.orientechnologies.orient.core.exception.OConfigurationException');
        done();
      });
    })
  });
});
describe('Server::create()', function () {
  it("should create a new database", function (done) {
    TEST_SERVER.create({
      name: 'testdb_server',
      type: 'graph',
      storage: 'memory'
    })
    .then(function (db) {
      db.name.should.equal('testdb_server');
      done();
    }, done).done();
  });
});
describe('Server::list()', function () {
  it("should list the existing databases", function (done) {
    TEST_SERVER.list()
    .then(function (dbs) {
      var names = Object.keys(dbs),
          total = names.length,
          i, db, name;
      for (i = 0; i < total; i++) {
        name = names[i];
        db = dbs[name];
        db.should.be.an.instanceOf(LIB.Db);
      }
      dbs.testdb_server.storage.should.equal('memory');
      done();
    }, done).done();
  });
});
describe('Server::exists()', function () {
  it("should confirm an existing database exists", function (done) {
    TEST_SERVER.exists('testdb_server')
    .then(function (exists) {
      exists.should.be.true;
      done();
    }, done);
  });
  it("should confirm a missing database does not exist", function (done) {
    TEST_SERVER.exists('a_missing_database')
    .then(function (exists) {
      exists.should.be.false;
      done();
    }, done);
  });
});
describe('Server::delete()', function () {
  it("should delete a database", function (done) {
    TEST_SERVER.delete({
      name: 'testdb_server',
      type: 'graph',
      storage: 'memory'
    })
    .then(function (response) {
      response.should.be.true;
      done();
    }, done).done();
  });
});
describe('Server::config.list', function () {
  it("should list the server config", function (done) {
    TEST_SERVER.config.list()
    .then(function (config) {
      config.should.have.property('db.pool.min');
      done();
    }, done).done();
  });
});

describe('Server::config.get', function () {
  it("should get a server config key", function (done) {
    TEST_SERVER.config.get('db.pool.min')
    .then(function (value) {
      value.should.have.type('string');
      done();
    }, done).done();
  });
});