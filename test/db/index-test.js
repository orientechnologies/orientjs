var Index = require('../../lib/db/index/index'),
    Promise = require('bluebird');

describe("Database API - Index", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_index')
    .bind(this)
    .then(function () {
      return this.db.class.create('TestClass');
    })
    .then(function (TestClass) {
      return TestClass.property.create({
        name: 'name',
        type: 'String'
      })
      .return(null);
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_index');
  });

  describe('Db::index.list()', function () {
    it('should list the indices in the database', function () {
      return this.db.index.list()
      .bind(this)
      .then(function (indices) {
        indices.length.should.be.above(0);
        indices[0].should.be.an.instanceOf(Index);
      });
    });
  });

  describe('Db::index.create()', function () {
    it('should create a new index', function () {
      return this.db.index.create({
        name: 'TestClass.name',
        class: 'TestClass',
        properties: ['name'],
        type: 'unique'
      })
      .then(function (index) {
        index.should.be.an.instanceOf(Index);
      });
    });
  });

  describe('Db::index.get()', function () {
    it('should get an index by name', function () {
      return this.db.index.get('TestClass.name')
      .then(function (index) {
        index.should.be.an.instanceOf(Index);
      });
    });
  });

  describe('Db::index.drop()', function () {
    it('should delete an index', function () {
      return this.db.index.drop('TestClass.name');
    });
  });

  describe('Db::index::*', function () {

    before(function () {
      return this.db.index.get('dictionary')
      .bind(this)
      .then(function (index) {
        this.index = index;
        return this.db.class.get('TestClass');
      })
      .then(function (TestClass) {
        return Promise.all([
          TestClass.create({
            name: 'name 1'
          }),
          TestClass.create({
            name: 'name 2'
          }),
          TestClass.create({
            name: 'name 3'
          }),
          TestClass.create({
            name: 'name 4'
          }),
          TestClass.create({
            name: 'name 5'
          })
        ]);
      })
      .then(function (items) {
        this.items = items;
      });
    });

    describe('Db::index::add()', function () {
      it('should add a single record into the index', function () {
        return this.index.add({
          key: this.items[0].name,
          rid: this.items[0]['@rid']
        })
        .then(function (results) {
          results.length.should.equal(1);
        });
      });
      it('should add multiple records into the index', function () {
        return this.index.add(this.items.slice(1).map(function (item) {
          return {
            key: item.name,
            rid: item['@rid']
          };
        }))
        .then(function (results) {
          results.length.should.equal(4);
        });
      });
    });

    describe('Db::index::set()', function () {
      it('should set a key to a value', function () {
        return this.index.set(this.items[4].name, this.items[4]['@rid']);
      });
    });

    describe('Db::index::get()', function () {
      it('should get a key value', function () {
        return this.index.get(this.items[4].name)
        .bind(this)
        .then(function (result) {
          result.rid.should.eql(this.items[4]['@rid']);
        });
      });

      it('should handle a missing key value', function () {
        return this.index.get('missing key value')
        .bind(this)
        .then(function (result) {
          expect(typeof result).to.equal('undefined');
        });
      });
    });


    describe('Db::index::select()', function () {
      it('should select all the results from the index', function () {
        return this.index.select().all()
        .then(function (results) {
          results.length.should.equal(5);
          results[0].key.should.equal('name 1');
        });
      });
      it('should select from an index with a query', function () {
        return this.index.select('rid').column('rid').where({key: 'name 1'}).one()
        .then(function (rid) {
          rid.should.be.an.instanceOf(LIB.RID);
        })
      });
    });


    describe('Db::index::delete()', function () {
      it('should delete a key', function () {
        return this.index.delete(this.items[4].name);
      });
    });
  });
});