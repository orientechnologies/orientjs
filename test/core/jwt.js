var Bluebird = require('bluebird');
describe('JWT', function () {
  var hasProtocolSupport = false,
      server = null;
  function ifSupportedIt (text, fn) {
    it(text, function () {
      if (hasProtocolSupport) {
        return fn.call(this);
      }
      else {
        console.log('        skipping, "'+text+'": operation not supported by OrientDB version');
      }
    });
  }
  before(function () {
    server = new LIB.Server({
      host: TEST_SERVER_CONFIG.host,
      port: TEST_SERVER_CONFIG.port,
      username: TEST_SERVER_CONFIG.username,
      password: TEST_SERVER_CONFIG.password,
      transport: 'binary',
      useToken: true
    });
    return CREATE_TEST_DB(this, 'testdb_jwt')
    .bind(this)
    .then(function () {
      hasProtocolSupport = this.db.server.transport.connection.protocolVersion >= 28;
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_jwt');
  });
  describe('JWT Server::connect()', function () {
    var dbs;
    before(function () {
      return server.list()
      .then(function (items) {
        dbs = items;
      });
    });
    ifSupportedIt('should connect to the server and get a token', function () {
      server.token.should.be.an.instanceOf(Buffer);
      server.token.length.should.be.above(0);
    });
    ifSupportedIt('should retrieve a list of databases', function () {
      dbs.length.should.be.above(0);
    });
  });
  describe('JWT Server::use()', function () {
    var db;
    before(function () {
      db = server.use({
        name: 'testdb_jwt',
        username: 'admin',
        password: 'admin'
      });
      return db.open();
    })
    ifSupportedIt('should open a database and get a token', function () {
      db.token.should.be.an.instanceOf(Buffer);
      db.token.length.should.be.above(0);
    });
    ifSupportedIt('should return a different token from the server token', function () {
      db.token.toString().should.not.equal(server.token.toString());
    });
    ifSupportedIt('should execute commands using the token', function () {
      return db.select().from('OUser').all()
      .then(function (users) {
        users.length.should.be.above(0);
      });
    });
  });
  describe('JWT Database::query()', function () {
    var db, admin, reader, writer;
    before(function () {
      if (hasProtocolSupport) {
        db = server.use('testdb_jwt');
        return Bluebird.all([
          server.use({name: 'testdb_jwt', username: 'admin', password: 'admin'}).open(),
          server.use({name: 'testdb_jwt', username: 'reader', password: 'reader'}).open(),
          server.use({name: 'testdb_jwt', username: 'writer', password: 'writer'}).open()
        ])
        .then(function (items) {
          admin = items[0].token;
          reader = items[1].token;
          writer = items[2].token;

          admin.toString().should.not.equal(reader.toString());
          admin.toString().should.not.equal(writer.toString());
          writer.toString().should.not.equal(reader.toString());
        });
      }
    });
    ifSupportedIt('should not allow the reader to create a vertex', function () {
      return db.create('VERTEX', 'V').set({foo: 'bar'}).token(reader).one()
      .then(function () {
        throw new Error('No, this should not happen');
      })
      .catch(LIB.errors.RequestError, function (err) {
        /permission/i.test(err.message).should.be.true;
      });
    });
    ifSupportedIt('should allow the reader to read from a class', function () {
      return db.select().from('OUser').token(reader).all()
      .then(function (users) {
        users.length.should.be.above(0);
      });
    });
    ifSupportedIt('should allow the writer to create a vertex', function () {
      return db.create('VERTEX', 'V').set({foo: 'bar'}).token(writer).one()
      .then(function (item) {
        item.foo.should.equal('bar');
      });
    });
    ifSupportedIt('should allow the writer to read from a class', function () {
      return db.select().from('OUser').token(writer).all()
      .then(function (users) {
        users.length.should.be.above(0);
      });
    });
    ifSupportedIt('should allow the admin to create a vertex', function () {
      return db.create('VERTEX', 'V').set({foo: 'bar'}).token(admin).one()
      .then(function (item) {
        item.foo.should.equal('bar');
      });
    });
    ifSupportedIt('should allow the admin to read from a class', function () {
      return db.select().from('OUser').token(admin).all()
      .then(function (users) {
        users.length.should.be.above(0);
      });
    });

    ifSupportedIt('should allow the default user to create a vertex', function () {
      return db.create('VERTEX', 'V').set({foo: 'bar'}).one()
      .then(function (item) {
        item.foo.should.equal('bar');
      });
    });
    ifSupportedIt('should allow the default user to read from a class', function () {
      return db.select().from('OUser').all()
      .then(function (users) {
        users.length.should.be.above(0);
      });
    });

    describe('Db::createUserContext()', function () {
      var readerContext, adminContext;
      before(function () {
        if (hasProtocolSupport) {
          readerContext = db.createUserContext(reader);
          adminContext = db.createUserContext(admin);
        }
      });
      ifSupportedIt('should create a user context', function () {
        return readerContext.select().from('OUser').all()
        .then(function (users) {
          users.length.should.be.above(1);
        });
      });
      ifSupportedIt('should ensure that the token is used correctly', function () {
        return readerContext.create('VERTEX', 'V').set({greeting: 'hello world'}).one()
        .then(function () {
          throw new Error('No, this should not happen');
        })
        .catch(LIB.errors.RequestError, function (err) {
          /permission/i.test(err.message).should.be.true;
        });
      });
      ifSupportedIt('should insert a row using the admin context', function () {
        return adminContext.insert().into('OUser').set({name: 'foo', password: 'bar', status: 'active'}).one()
        .then(function (data) {
          data['@class'].should.equal('OUser');
        });
      });
    });
  });
});