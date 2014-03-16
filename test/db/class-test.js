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
  });

});