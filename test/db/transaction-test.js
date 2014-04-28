var Transaction = require('../../lib/db/transaction');

describe.only("Database API - Transaction", function () {
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
  describe("Db::transaction.create()", function () {
    beforeEach(function () {
      this.tx = this.db.begin();
    });
    it.only('should create a single record', function () {
      var completed = false;
      this.tx.create({
        '@class': 'TestClass',
        name: 'item1'
      })
      .then(function (record) {
        record['@rid'].should.be.an.instanceOf(LIB.RID);
        completed = true;
      });

      this.tx.create({
        '@class': 'TestClass',
        name: 'item2'
      })

      this.tx.create({
        '@class': 'TestClass',
        name: 'item3'
      })

      return this.tx.commit()
      .then(function (results) {
        completed.should.be.true;
      });

    });
  });
  describe("Db::transaction.delete()", function () {
  });

});