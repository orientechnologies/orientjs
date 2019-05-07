var should = require("should");

var ORidBag = require("../../lib/client/database/bag").ORidBag;
var RID = require("../../lib").RID;

describe("ODatabaseSession API - Open / Simple Query", function() {
  before(
    CAN_RUN(37, function() {
      return CREATE_DB("test_complex_records");
    })
  );
  after(CAN_RUN_AFTER(37,function() {
    return DROP_DB("test_complex_records");
  }));

  describe("Database::Links & Embedded", function() {
    before(function() {
      return TEST_CLIENT.session({ name: "test_complex_records" })
        .then(db => {
          this.db = db;
          return db.command("create class Foo").all();
        })
        .then(() => {
          return this.db.query("SELECT * FROM OUser").all();
        })
        .then(results => {
          this.links = results.map(r => {
            return r["@rid"];
          });
        });
    });
    after(function() {
      return this.db.close();
    });

    beforeEach(function() {
      return this.db.command("delete from Foo").all();
    });
    it("should create a simple record with Links", function() {
      var record = {
        "@class": "Foo",
        links: this.links
      };
      return this.db.record
        .create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        })
        .then(response => {
          response[0].links.should.be.eql(this.links);
        });
    });

    it("should create a simple record with embedded map", function() {
      var record = {
        "@class": "Foo",
        embedded: { name: "Foo" }
      };
      return this.db.record
        .create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        })
        .then(response => {
          response[0].embedded.should.be.eql({ name: "Foo" });
        });
    });

    it("should create a simple record with embedded document with class", function() {
      var record = {
        "@class": "Foo",
        embedded: { "@class": "Foo", name: "Foo" }
      };
      return this.db.record
        .create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        })
        .then(response => {
          response[0].embedded.should.be.eql({ "@class": "Foo", name: "Foo" });
        });
    });

    it("should create a simple record with embedded strings", function() {
      var record = {
        "@class": "Foo",
        strings: ["foo", "bar"]
      };
      return this.db.record
        .create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        })
        .then(response => {
          response[0].strings.should.be.eql(["foo", "bar"]);
        });
    });

    it("should create a simple record with embedded numbers", function() {
      var record = {
        "@class": "Foo",
        numbers: [2, 10]
      };
      return this.db.record
        .create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        })
        .then(response => {
          response[0].numbers.should.be.eql([2, 10]);
        });
    });

    it("should create a simple record with embedded dates", function() {
      var dates = [new Date(), new Date()];
      var record = {
        "@class": "Foo",
        dates: dates
      };
      return this.db.record
        .create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        })
        .then(response => {
          response[0].dates.should.be.eql(dates);
        });
    });

    it("should create a simple record with embedded mix numbers/strings/date", function() {
      var mix = [2, "Now", new Date()];
      var record = {
        "@class": "Foo",
        mixes: mix
      };
      return this.db.record
        .create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        })
        .then(response => {
          response[0].mixes.should.be.eql(mix);
        });
    });

    it("should create a simple record with link map", function() {
      var record = {
        "@class": "Foo",
        name: "Test"
      };
      return this.db.record
        .create(record)
        .then(response => {
          return this.db
            .command(
              `insert into Foo set linkMap = { "foo" : ${
                response["@rid"]
              }, "bar" : null }`
            )
            .one();
        })
        .then(response => {
          return this.db.query("select from " + response["@rid"]).one();
        })
        .then(response => {
          response.linkMap.foo.should.be.an.instanceOf(RID);
          should(response.linkMap["bar"]).be.null;
        });
    });

    it("should create a simple record with big decimal", function() {
      return this.db
        .command("create property Foo.decimal DECIMAL")
        .all()
        .then(response => {
          return this.db.command(`insert into Foo set decimal = 0.32`).one();
        })
        .then(response => {
          response.decimal.should.be.eql(0.32);
        });
    });
  });

  describe("Database::RidBags", function() {
    before(function() {
      return TEST_CLIENT.session({ name: "test_complex_records" }).then(db => {
        this.db = db;
      });
    });
    after(function() {
      return this.db.close();
    });

    it("should create two vertices and edge", function() {
      var query = `let v1 = create vertex V set name = 'Foo';
      let v2 = create vertex V set name = 'Foo1';
      create edge from $v1 to $v2;
      return $v1`;
      return this.db
        .batch(query)
        .all()
        .then(response => {
          response[0]["@class"].should.be.eql("V");
          response[0]["out_"].should.be.an.instanceOf(ORidBag);
          response[0]["out_"].size().should.be.eql(1);
          var rids = [];
          for (var rid of response[0]["out_"]) {
            rids.push(rid);
          }
          rids.length.should.be.eql(1);
          rids[0].should.be.an.instanceOf(RID);
        });
    });
  });
});
