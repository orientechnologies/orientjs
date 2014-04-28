var Transaction = require('../../lib/db/transaction');

describe("Database API - Transaction", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_tx')
    .bind(this)
    .then(function () {
      return this.db.class.create('TestClass', 'V');
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_tx');
  });
  describe("Db::begin()", function () {
    it('should return a new transaction instance', function () {
      var tx = this.db.begin();
      tx.should.be.an.instanceOf(Transaction);
      tx.id.should.be.above(0);
    });
  });

  describe('Db::commit()', function () {
    before(function () {
      return this.db.record.create([
        {
          '@class': 'TestClass',
          name: 'item1'
        },
        {
          '@class': 'TestClass',
          name: 'item2'
        }
      ])
      .bind(this)
      .spread(function (first, second) {
        this.first = first;
        this.second = second;
      });
    });
    it('should perform a single action', function () {
      this.tx = this.db.begin();
      this.tx.create({
        '@class': 'TestClass',
        name: 'item3'
      });
      return this.tx.commit()
      .then(function (results) {
        results.created.length.should.equal(1);
        results.updated.length.should.equal(0);
        results.deleted.length.should.equal(0);
      });
    });
    it('should perform multiple actions', function () {
      this.tx = this.db.begin();
      this.first.wat = 'wat';
      this.tx
      .create({
        '@class': 'TestClass',
        name: 'item4'
      })
      .delete(this.second)
      .update(this.first);

      return this.tx.commit()
      .then(function (results) {
        results.created.length.should.equal(1);
        results.updated.length.should.equal(1);
        results.deleted.length.should.equal(1);
      });
    });
  });

  describe("Db::transaction.create()", function () {
    it('should create a single record', function () {
      this.tx = this.db.begin();
      return this.tx
      .create({
        '@class': 'TestClass',
        name: 'item1'
      })
      .commit()
      .bind(this)
      .then(function (results) {
        results.created.length.should.equal(1);
        results.updated.length.should.equal(0);
        results.deleted.length.should.equal(0);
      });
    });

    it('should create multiple records', function () {
      this.tx = this.db.begin();
      return this.tx
      .create({
        '@class': 'TestClass',
        name: 'item1'
      })
      .create({
        '@class': 'TestClass',
        name: 'item2'
      })
      .create({
        '@class': 'TestClass',
        name: 'item3'
      })
      .commit()
      .then(function (results) {
        results.created.length.should.equal(3);
        results.updated.length.should.equal(0);
        results.deleted.length.should.equal(0);
      });
    });
  });
  describe("Db::transaction.update()", function () {
    beforeEach(function () {
      this.tx = this.db.begin();
      return this.db.record.create([
        {
          '@class': 'TestClass',
          name: 'updateMe1'
        },
        {
          '@class': 'TestClass',
          name: 'updateMe2'
        }
      ])
      .bind(this)
      .spread(function (first, second) {
        this.first = first;
        this.second = second;
      });
    });
    it('should update a single record', function () {
      this.first.foo = 'foo';
      return this.tx
      .update(this.first)
      .commit()
      .then(function (results) {
        results.created.length.should.equal(0);
        results.updated.length.should.equal(1);
        results.deleted.length.should.equal(0);
      });
    });
    it('should update multiple records', function () {
      this.first.foo = 'foo';
      this.second.baz = 'baz';
      return this.tx
      .update(this.first)
      .update(this.second)
      .commit()
      .then(function (results) {
        results.created.length.should.equal(0);
        results.updated.length.should.equal(2);
        results.deleted.length.should.equal(0);
      });
    });
  });
  describe("Db::transaction.delete()", function () {
    beforeEach(function () {
      this.tx = this.db.begin();
      return this.db.record.create([
        {
          '@class': 'TestClass',
          name: 'deleteMe1'
        },
        {
          '@class': 'TestClass',
          name: 'deleteMe2'
        }
      ])
      .bind(this)
      .spread(function (first, second) {
        this.first = first;
        this.second = second;
      });
    });
    it('should delete a single record', function () {
      return this.tx
      .delete(this.first)
      .commit()
      .then(function (results) {
        results.created.length.should.equal(0);
        results.updated.length.should.equal(0);
        results.deleted.length.should.equal(1);
      });
    });
    it('should delete multiple records', function () {
      return this.tx
      .delete(this.first)
      .delete(this.second)
      .commit()
      .then(function (results) {
        results.created.length.should.equal(0);
        results.updated.length.should.equal(0);
        results.deleted.length.should.equal(2);
      });
    });
  });
});