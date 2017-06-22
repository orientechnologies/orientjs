"use strict";
var Transaction = require('../../lib/db/transaction'),
  RID = require('../../lib/recordid'),
  Promise = require('bluebird');

describe("ODatabase API - Transaction", function () {


  function createBinaryRecord(text) {
    var record = new Buffer(text);
    record['@type'] = 'b';
    record['@class'] = 'V';
    return record;
  }


  before(CAN_RUN(37, function () {

    return CREATE_TEST_DB(this, 'testdb_dbapi_tx')
      .bind(this)
      .then(() => {
        return TEST_CLIENT.open({name: "testdb_dbapi_tx"});
      })
      .then((db) => {
        this.db = db;
      })
      .then(function () {
        return Promise.all([this.db.class.create('TestClass', 'V'), this.db.class.create('TestClassTx', 'V')]);
      });
  }));
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_tx');
  });

  describe("ODatabase::begin()", function () {
    it('should return a new transaction instance', function () {
      var tx = this.db.begin();
      tx.should.be.an.instanceOf(Transaction);
      tx.id.should.be.above(0);
      this.db.currentTx = null;
    });
  });
  //
  describe('ODatabase::commit()', function () {
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

  describe("ODatabase::transaction.create()", function () {
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
  describe("ODatabase::transaction.update()", function () {
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
        },
        createBinaryRecord('some text...')
      ])
        .bind(this)
        .spread(function (first, second, third) {
          this.first = first;
          this.second = second;
          this.third = third;
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
  describe("ODatabase::transaction.delete()", function () {
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
        },
        createBinaryRecord('some text...')
      ])
        .bind(this)
        .spread(function (first, second, third) {
          this.first = first;
          this.second = second;
          this.third = third;
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
  describe("ODatabase::Transaction SQL", function () {
    beforeEach(function () {
      return this.db.query("delete vertex TestClassTX").all()
    })

    it('should create a record in tx with sql', function () {
      this.db.begin();

      return this.db.query("insert into TestClassTx set name = 'Foo'").all()
        .bind(this)
        .then(function (res) {
          res.length.should.equal(1);
          res[0]["@rid"].should.be.instanceOf(RID);
          RID.isTemporary(res[0]["@rid"]).should.be.eql(true, res[0]["@rid"]);
          return this.db.tx().commit({created: res});
        }).then((function (results) {
          results.created.length.should.equal(1);
          results.updated.length.should.equal(0);
          results.deleted.length.should.equal(0);
          RID.isValid(results.created[0]["@rid"]).should.be.eql(true);
          results.created[0].name.should.be.eql("Foo");
          return this.db.query("select * from TestClassTX").all()
        })).then(function (res) {
          res.length.should.equal(1)
          res[0]["@rid"].should.be.instanceOf(RID);
          RID.isTemporary(res[0]["@rid"]).should.be.eql(false, res[0]["@rid"]);
          RID.isValid(res[0]["@rid"]).should.be.eql(true, res[0]["@rid"]);
          res[0].name.should.be.eql("Foo");
        });
    })
  });
  describe("ODatabase::Transaction Complex", function () {



    beforeEach(function () {
      return this.db.query("delete vertex TestClassTX").all()
    })
    it('should create a record in tx with final commit', function () {
      this.db.begin().create({
        '@class': 'TestClassTx',
        name: 'item1'
      });
      return this.db.query("select * from TestClassTX").all()
        .bind(this)
        .then(function (res) {
          res.length.should.equal(1);
          res[0]["@rid"].should.be.instanceOf(RID);
          RID.isTemporary(res[0]["@rid"]).should.be.eql(true, res[0]["@rid"]);
          return this.db.tx().commit();
        }).then((function (results) {
          results.created.length.should.equal(1);
          results.updated.length.should.equal(0);
          results.deleted.length.should.equal(0);
          return this.db.query("select * from TestClassTX").all()
        })).then(function (res) {
          res.length.should.equal(1)
          res[0]["@rid"].should.be.instanceOf(RID);
          RID.isTemporary(res[0]["@rid"]).should.be.eql(false, res[0]["@rid"]);
          RID.isValid(res[0]["@rid"]).should.be.eql(true, res[0]["@rid"]);
        });
    })

    it('should create a record in tx with final rollback', function () {
      this.db.begin().create({
        '@class': 'TestClassTx',
        name: 'item1'
      });
      return this.db.query("select * from TestClassTX").all()
        .bind(this)
        .then(function (res) {
          res.length.should.equal(1);
          res[0]["@rid"].should.be.instanceOf(RID);
          RID.isTemporary(res[0]["@rid"]).should.be.eql(true, res[0]["@rid"]);
          return this.db.tx().rollback();
        }).then((function (results) {
          results.created.length.should.equal(0);
          results.updated.length.should.equal(0);
          results.deleted.length.should.equal(0);
          return this.db.query("select * from TestClassTX").all()
        })).then(function (res) {
          res.length.should.equal(0)
        });
    })

    it('should create a record in tx with more steps and with final rollback', function () {
      this.db.begin().create({
        '@class': 'TestClassTx',
        name: 'item1'
      });
      return this.db.query("select * from TestClassTX").all()
        .bind(this)
        .then(function (res) {
          res.length.should.equal(1);
          res[0]["@rid"].should.be.instanceOf(RID);
          RID.isTemporary(res[0]["@rid"]).should.be.eql(true, res[0]["@rid"]);
          this.db.tx().create({
            '@class': 'TestClassTx',
            name: 'item2'
          });
          return this.db.query("select * from TestClassTX").all()
        }).then(function (res) {
          res.length.should.equal(2);
          res[0]["@rid"].should.be.instanceOf(RID);
          RID.isTemporary(res[0]["@rid"]).should.be.eql(true, res[0]["@rid"]);
          return this.db.tx().rollback();
        }).then((function (results) {
          results.created.length.should.equal(0);
          results.updated.length.should.equal(0);
          results.deleted.length.should.equal(0);
          return this.db.query("select * from TestClassTX").all()
        })).then(function (res) {
          res.length.should.equal(0)
        });
    })

    it('should create a record in tx with more steps and with final commit', function () {
      this.db.begin().create({
        '@class': 'TestClassTx',
        name: 'item1'
      });
      return this.db.query("select * from TestClassTX").all()
        .bind(this)
        .then(function (res) {
          res.length.should.equal(1);
          res[0]["@rid"].should.be.instanceOf(RID);
          RID.isTemporary(res[0]["@rid"]).should.be.eql(true, res[0]["@rid"]);
          this.db.tx().create({
            '@class': 'TestClassTx',
            name: 'item2'
          });
          return this.db.query("select * from TestClassTX").all()
        }).then(function (res) {
          res.length.should.equal(2);
          res[0]["@rid"].should.be.instanceOf(RID);
          RID.isTemporary(res[0]["@rid"]).should.be.eql(true, res[0]["@rid"]);
          return this.db.tx().commit();
        }).then((function (results) {
          results.created.length.should.equal(2);
          results.updated.length.should.equal(0);
          results.deleted.length.should.equal(0);
          return this.db.query("select * from TestClassTX").all()
        })).then(function (res) {
          res.length.should.equal(2)
        });
    })
  })
});


