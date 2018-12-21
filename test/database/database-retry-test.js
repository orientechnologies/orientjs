"use strict";
var Transaction = require("../../lib/db/transaction"),
  RID = require("../../lib/recordid"),
  Promise = require("bluebird");

describe("ODatabaseSession API - Transaction", function() {
  before(
    CAN_RUN(37, function() {
      return CREATE_TEST_DB(this, "testdb_dbapi_retry")
        .bind(this)
        .then(() => {
          return Promise.all([
            TEST_CLIENT.session({ name: "testdb_dbapi_retry" }),
            TEST_CLIENT.session({ name: "testdb_dbapi_retry" })
          ]);
        })
        .then(dbs => {
          this.db = dbs[0];
          this.db1 = dbs[1];
        })
        .then(function() {
          return Promise.all([this.db.class.create("TestClass", "V")]);
        });
    })
  );
  after(function() {
    return DELETE_TEST_DB("testdb_dbapi_retry");
  });

  describe("ODatabase::retry()", function() {
    beforeEach(function() {
      return this.db.command("delete vertex TestClass").all();
    });
    it("should run parallel updates with retry", function() {
      return this.db
        .runInTransaction(tx => {
          return tx.command("insert into TestClass set name = 'Foo'").all();
        })
        .then(({ result, tx }) => {
          result.length.should.equal(1);
          tx.applyChanges({ created: result });
          let record = result[0];
          record.name = "Foo1";

          let p1 = this.db.retry(db => {
            return db
              .command("update  TestClass set name = 'Foo1' where name = 'Foo'")
              .all();
          }, 10);
          let p2 = this.db1.retry(db => {
            return db
              .command("update  TestClass set name = 'Foo1' where name = 'Foo'")
              .all();
          }, 10);
          return Promise.all([p1, p2]);
        })
        .then(result => {
          result.length.should.be.eql(2);
          result[0].length.should.be.eql(1);
          result[1].length.should.be.eql(1);
        });
    });

    it("should run parallel updates in tx with retry", function() {
      return this.db
        .runInTransaction(tx => {
          return tx.command("insert into TestClass set name = 'Foo'").all();
        })
        .then(({ result, tx }) => {
          result.length.should.equal(1);
          tx.applyChanges({ created: result });
          let record = result[0];
          record.name = "Foo1";

          let p1 = this.db.runInTransaction(tx => {
            return tx
              .command("update  TestClass set name = 'Foo1' where name = 'Foo'")
              .all();
          }, 10);
          let p2 = this.db1.runInTransaction(tx => {
            return tx
              .command("update TestClass set name = 'Foo1' where name = 'Foo'")
              .all();
          }, 10);
          return Promise.all([p1, p2]);
        })
        .then(data => {
          data.length.should.be.eql(2);
          data[0].result.length.should.be.eql(1);
          data[1].result.length.should.be.eql(1);
        });
    });
  });
});
