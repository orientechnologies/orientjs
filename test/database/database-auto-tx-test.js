"use strict";
var Transaction = require("../../lib/db/transaction"),
  RID = require("../../lib/recordid"),
  Promise = require("bluebird");

describe("ODatabase API - Transaction", function() {
  function createBinaryRecord(text) {
    var record = new Buffer(text);
    record["@type"] = "b";
    record["@class"] = "V";
    return record;
  }

  before(
    CAN_RUN(37, function() {
      return CREATE_TEST_DB(this, "testdb_dbapi_tx")
        .bind(this)
        .then(() => {
          return TEST_CLIENT.open({ name: "testdb_dbapi_tx" });
        })
        .then(db => {
          this.db = db;
        })
        .then(function() {
          return Promise.all([
            this.db.class.create("TestClass", "V"),
            this.db.class.create("TestClassTx", "V")
          ]);
        });
    })
  );
  after(function() {
    return DELETE_TEST_DB("testdb_dbapi_tx");
  });

  describe("ODatabase::runInTransaction()", function() {
    beforeEach(function() {
      return this.db.command("delete vertex TestClassTX").all();
    });
    it("should run a query in auto tx", function() {
      return this.db
        .runInTransaction(tx => {
          return tx.query("select from TestClassTx").all();
        })
        .then(({ result, tx }) => {
          result.length.should.equal(0);
          tx.created.length.should.equal(0);
          tx.updated.length.should.equal(0);
          tx.deleted.length.should.equal(0);
          expect(this.db.tx()).to.equal(null);
        });
    });
    it("should run an insert command in auto tx", function() {
      return this.db
        .runInTransaction(tx => {
          return tx
            .command("insert into TestClassTx set name = :name", {
              params: { name: "Foo" }
            })
            .all();
        })
        .then(({ result, tx }) => {
          result.length.should.equal(1);
          RID.isTemporary(result[0]["@rid"]).should.be.eql(
            true,
            result[0]["@rid"]
          );
          tx.created.length.should.equal(1);
          RID.isTemporary(tx.created[0]["@rid"]).should.be.eql(
            false,
            tx.created[0]["@rid"]
          );
          tx.updated.length.should.equal(0);
          tx.deleted.length.should.equal(0);
          expect(this.db.tx()).to.equal(null);
        });
    });

    it("should run an insert command in auto tx", function() {
      return this.db
        .runInTransaction(tx => {
          return tx
            .command("insert into TestClassTx set name = :name", {
              params: { name: "Foo" }
            })
            .all();
        })
        .then(({ result, tx }) => {
          result.length.should.equal(1);
          RID.isTemporary(result[0]["@rid"]).should.be.eql(
            true,
            result[0]["@rid"]
          );
          tx.created.length.should.equal(1);
          RID.isTemporary(tx.created[0]["@rid"]).should.be.eql(
            false,
            tx.created[0]["@rid"]
          );
          tx.updated.length.should.equal(0);
          tx.deleted.length.should.equal(0);
          expect(this.db.tx()).to.equal(null);
        });
    });
    it("should run an insert command + create in auto tx", function() {
      return this.db
        .runInTransaction(tx => {
          return tx
            .create({
              "@class": "TestClassTx",
              name: "item1"
            })
            .command("insert into TestClassTx set name = :name", {
              params: { name: "Foo" }
            })
            .all();
        })
        .then(({ result, tx }) => {
          result.length.should.equal(1);
          RID.isTemporary(result[0]["@rid"]).should.be.eql(
            true,
            result[0]["@rid"]
          );
          tx = tx.applyChanges({ created: result });
          RID.isTemporary(result[0]["@rid"]).should.be.eql(
            false,
            result[0]["@rid"]
          );
          tx.created.length.should.equal(2);
          RID.isTemporary(tx.created[0]["@rid"]).should.be.eql(
            false,
            tx.created[0]["@rid"]
          );
          RID.isTemporary(tx.created[1]["@rid"]).should.be.eql(
            false,
            tx.created[1]["@rid"]
          );
          tx.created[0].name.should.be.eql("Foo");
          tx.created[1].name.should.be.eql("item1");
          tx.updated.length.should.equal(0);
          tx.deleted.length.should.equal(0);
          expect(this.db.tx()).to.equal(null);
        });
    });

    it("should run an tx create in auto tx", function() {
      return this.db
        .runInTransaction(tx => {
          return tx
            .create({
              "@class": "TestClassTx",
              name: "item1"
            })
            .commit();
        })
        .then(({ result, tx }) => {
          tx = result;
          tx.created.length.should.equal(1);
          RID.isTemporary(tx.created[0]["@rid"]).should.be.eql(
            false,
            tx.created[0]["@rid"]
          );
          tx.created[0].name.should.be.eql("item1");
          tx.updated.length.should.equal(0);
          tx.deleted.length.should.equal(0);
          expect(this.db.tx()).to.equal(null);
        });
    });
  });
});
