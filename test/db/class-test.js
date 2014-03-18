var Class = require('../../lib/db/class');

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
      .bind(this)
      .then(function (classes) {
        classes.length.should.be.above(0);
        classes[0].should.be.an.instanceOf(Class);
        done();
      }, done).done();
    });
  });

  describe('Db::class.get()', function () {
    it('should get the class with the given name', function (done) {
      this.db.class.get('OUser')
      .then(function (item) {
        item.should.be.an.instanceOf(Class);
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
        item.should.be.an.instanceOf(Class);
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


  describe('Instance functions', function () {
    before(function (done) {
      this.db.class.get('OUser')
      .bind(this)
      .then(function (OUser) {
        this.OUser = OUser;
        done();
      }, done).done();
    });

    describe('Db::Class::list()', function () {
      it('should list the records in the class', function (done) {
        this.OUser.list()
        .then(function (users) {
          users.length.should.be.above(0);
          users[0].should.have.property('@rid');
          done();
        }, done).done();
      });
    });

    describe('Db::Class::create()', function () {
      it('should create a new record for the class', function (done) {
        this.OUser.create({
          name: 'TestUser',
          password: 'AtestPassWord',
          status: 'ACTIVE'
        })
        .then(function (user) {
          user['@rid'].position.should.be.above(-1);
          done();
        }, done).done();
      });
    });

    describe('Db::Class::find()', function () {
      it('should find records in the class', function (done) {
        this.OUser.find({
          name: 'TestUser',
          status: 'ACTIVE'
        })
        .then(function (users) {
          users.length.should.be.above(0);
          users[0].should.have.property('@rid');
          users[0].name.should.equal('TestUser')
          done();
        }, done).done();
      });
      it('should find records in the class with a limit', function (done) {
        this.OUser.find({
          status: 'ACTIVE'
        }, 1)
        .then(function (users) {
          users.length.should.equal(1);
          users[0].status.should.equal('ACTIVE');
          done();
        }, done).done();
      });
      it('should find records in the class with a limit and an offset', function (done) {
        this.OUser.find({
          status: 'ACTIVE'
        }, 1, 1)
        .then(function (users) {
          users.length.should.equal(1);
          users[0].status.should.equal('ACTIVE');
          done();
        }, done).done();
      });
      it('should not find records in the class', function (done) {
        this.OUser.find({
          name: 'TestUser',
          status: 'NOT_REAL_STATUS'
        })
        .then(function (users) {
          users.length.should.equal(0);
          done();
        }, done).done();
      });
      it('should find records in the class when no conditions are specified', function (done) {
        this.OUser.find({})
        .then(function (users) {
          users.length.should.be.above(0);
          users[0].should.have.property('@rid');
          done();
        }, done).done();
      });
    });

  });

});