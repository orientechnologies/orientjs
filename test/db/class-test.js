var Class = require('../../lib/db/class');
var Promise = require('bluebird');

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

  describe('Db::class.get()', function () {
    it('should get the class with the given name toLowerCase', function () {
      return this.db.class.get('ouser')
        .then(function (item) {
          item.should.be.an.instanceOf(Class);
          item.name.should.equal('OUser');
        });
    });
  });

  describe('Db::class.get()', function () {
    it('should get the class with the given name toUpperCase', function () {
      return this.db.class.get('ouser')
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
        item.should.have.property('superClass', null);
        item.should.be.an.instanceOf(Class);
      });
    });
    it('should create a class with the given name and a superClass', function () {
      return this.db.class.create('TestClassExtended', 'V')
      .then(function (item) {
        item.name.should.equal('TestClassExtended');
        item.should.have.property('superClass', 'V');
        item.should.be.an.instanceOf(Class);
      });
    });
  });

  describe('Db::class.update()', function () {
    before(function () {
      return Promise.all([
        this.db.class.create('FakeTestClass'),
        this.db.cluster.create('mycluster')
      ]);
    });
    it('should update a class with the given superClass', function () {
      return this.db.class.update({
        name: 'TestClass',
        superClass: 'V'
      })
      .then(function (item) {
        item.name.should.equal('TestClass');
        item.should.have.property('superClass', 'V');
        item.should.have.property('superClasses', ['V']);
        item.should.be.an.instanceOf(Class);
      });
    });
    /*it('should update a class with multiple superClasses', function () {
      var self = this;
      return new Promise(function (resolve) {
        self.db.class.create('OtherTestClass')
        .then(function (item) {
          self.db.class.update({
            name: 'OtherTestClass',
            superClasses: ['V', 'E']
          })
          .then(function (item) {
            item.name.should.equal('OtherTestClass');
            item.should.have.property('superClass', 'V, E');
            item.should.have.property('superClasses', ['V', 'E']);
            item.should.be.an.instanceOf(Class);
            resolve();
          });
        });
      });
    });*/
    it('should update a class by adding another superClass', function () {
      return this.db.class.update({
        name: 'TestClass',
        superClass: '+E'
      })
      .then(function (item) {
        item.name.should.equal('TestClass');
        item.should.have.property('superClass', 'V, E');
        item.should.have.property('superClasses', ['V', 'E']);
        item.should.be.an.instanceOf(Class);
      });
    });
    it('should update a class by removing a superClass', function () {
      return this.db.class.update({
        name: 'TestClass',
        superClass: '-V'
      })
      .then(function (item) {
        item.name.should.equal('TestClass');
        item.should.have.property('superClass', 'E');
        item.should.have.property('superClasses', ['E']);
        item.should.be.an.instanceOf(Class);
      });
    });
    it('should update a class with a new class name', function () {
      return this.db.class.update({
        name: 'FakeTestClass',
        changeName: 'SpecialTestClass'
      })
      .then(function (item) {
        item.name.should.equal('SpecialTestClass');
        item.should.be.an.instanceOf(Class);
      });
    });
    it('should update a class adding a cluster to it', function () {
      var self = this;
      return new Promise(function (resolve) {
        self.db.cluster.get('mycluster')
        .then(function (cluster) {
          self.db.class.update({
            name: 'TestClass',
            addCluster: cluster.id
          })
          .then(function (item) {
            item.name.should.equal('TestClass');
            item.clusterIds.should.containEql(cluster.id);
            item.should.be.an.instanceOf(Class);
            resolve();
          });
        });
      });
    });
    it('should update a class setting its cluster selection strategy to balanced', function () {
      return this.db.class.update({
        name: 'TestClass',
        clusterSelection: 'balanced'
      })
      .then(function (item) {
        item.name.should.equal('TestClass');
        item.should.be.an.instanceOf(Class);
      });
    });
    it('should update a class setting its cluster selection strategy to round-robin', function () {
      return this.db.class.update({
        name: 'TestClass',
        clusterSelection: 'round-robin'
      })
      .then(function (item) {
        item.name.should.equal('TestClass');
        item.should.be.an.instanceOf(Class);
      });
    });
    it('should update a class setting its cluster selection strategy to default', function () {
      return this.db.class.update({
        name: 'TestClass',
        clusterSelection: 'default'
      })
      .then(function (item) {
        item.name.should.equal('TestClass');
        item.should.be.an.instanceOf(Class);
      });
    });
    it('should update a class removing a cluster from it', function () {
      var self = this;
      return new Promise(function (resolve) {
        self.db.cluster.get('mycluster')
        .then(function (cluster) {
          self.db.class.update({
            name: 'TestClass',
            removeCluster: cluster.id
          })
          .then(function (item) {
            item.name.should.equal('TestClass');
            item.clusterIds.should.not.containEql(cluster.id);
            item.should.be.an.instanceOf(Class);
            resolve();
          });
        });
      });
    });
    it('should update a class changing it abstract', function () {
      return this.db.class.update({
        name: 'TestClass',
        abstract: true
      })
      .then(function (item) {
        item.name.should.equal('TestClass');
        item.should.have.property('abstract', true);
        item.should.be.an.instanceOf(Class);
      });
    });
    it('should update a class changing it to not abstract', function () {
      return this.db.class.update({
        name: 'TestClass',
        abstract: false
      })
      .then(function (item) {
        item.name.should.equal('TestClass');
        item.should.have.property('abstract', false);
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