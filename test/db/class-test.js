var Class = require('../../lib/db/class');

describe("Database API - Class", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_class');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_class');
  });
  describe('Db::class.list()', function () {
    it('should list the classes in the database', function () {
      return this.db.class.list()
      .bind(this)
      .then(function (classes) {
        classes.length.should.be.above(0);
        classes[0].should.be.an.instanceOf(Class);
      });
    });
  });

  describe('Db::class.get()', function () {
    it('should get the class with the given name', function () {
      return this.db.class.get('OUser')
      .then(function (item) {
        item.should.be.an.instanceOf(Class);
        item.name.should.equal('OUser');
      });
    });
  });

  describe('Db::class.create()', function () {
    it('should create a class with the given name', function () {
      return this.db.class.create('TestClass')
      .then(function (item) {
        item.name.should.equal('TestClass');
        item.should.be.an.instanceOf(Class);
      });
    });
  });

  describe('Db::class.drop()', function () {
    it('should delete a class with the given name', function () {
      return this.db.class.drop('TestClass');
    });
  });


  describe('Instance functions', function () {
    before(function () {
      return this.db.class.get('OUser')
      .bind(this)
      .then(function (OUser) {
        this.OUser = OUser;
      });
    });

    describe('Db::Class::list()', function () {
      it('should list the records in the class', function () {
        return this.OUser.list()
        .then(function (users) {
          users.length.should.be.above(0);
          users[0].should.have.property('@rid');
        });
      });
      it('should list the records in the class with a fetch plan', function () {
        return this.OUser.list({
          fetchPlan: '*:-1'
        })
        .then(function (users) {
          users.length.should.be.above(0);
        });
      });
    });

    describe('Db::Class::create()', function () {
      it('should create a new record for the class', function () {
        return this.OUser.create({
          name: 'TestUser',
          password: 'AtestPassWord',
          status: 'ACTIVE'
        })
        .then(function (user) {
          user['@rid'].position.should.be.above(-1);
        });
      });
    });

    describe('Db::Class::find()', function () {
      it('should find records in the class', function () {
        return this.OUser.find({
          name: 'TestUser',
          status: 'ACTIVE'
        })
        .then(function (users) {
          users.length.should.be.above(0);
          users[0].should.have.property('@rid');
          users[0].name.should.equal('TestUser');
        });
      });
      it('should find records in the class with a limit', function () {
        return this.OUser.find({
          status: 'ACTIVE'
        }, 1)
        .then(function (users) {
          users.length.should.equal(1);
          users[0].status.should.equal('ACTIVE');
        });
      });
      it('should find records in the class with a limit and an offset', function () {
        return this.OUser.find({
          status: 'ACTIVE'
        }, 1, 1)
        .then(function (users) {
          users.length.should.equal(1);
          users[0].status.should.equal('ACTIVE');
        });
      });
      it('should not find records in the class', function () {
        return this.OUser.find({
          name: 'TestUser',
          status: 'NOT_REAL_STATUS'
        })
        .then(function (users) {
          users.length.should.equal(0);
        });
      });
      it('should find records in the class when no conditions are specified', function () {
        return this.OUser.find({})
        .then(function (users) {
          users.length.should.be.above(0);
          users[0].should.have.property('@rid');
        });
      });
    });
  });
});