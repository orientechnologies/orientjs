var should = require('should');

describe("ODatabase API - Open / Simple Query", function () {
  before(CAN_RUN(37, function () {
    return CREATE_DB("test_session");

  }));
  after(function () {
    return DROP_DB("test_session");
  });


  describe('Database::RidBags & Embedded', function () {

    before(function () {
      return TEST_CLIENT.open({name: "test_session"})
        .then((db) => {
          this.db = db;
          return db.query('create class Foo').all();
        }).then(() => {
          return this.db.query('SELECT * FROM OUser').all()
        }).then((results) => {
          this.links = results.map((r) => {
            return r["@rid"];
          })
        });

    });
    after(function () {
      return this.db.close();
    });

    beforeEach(function () {
      return this.db.query("delete from Foo").all();
    })
    it('should create a simple record with Links', function () {
      var record = {
        "@class": "Foo",
        "links": this.links
      }
      return this.db.record.create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        }).then((response) => {
          response[0].links.should.be.eql(this.links);
        });
    });


    it('should create a simple record with embedded map', function () {
      var record = {
        "@class": "Foo",
        "embedded": {"name": "Foo"}
      }
      return this.db.record.create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        }).then((response) => {
          response[0].embedded.should.be.eql({"name": "Foo"});
        });
    });

    it('should create a simple record with embedded document with class', function () {
      var record = {
        "@class": "Foo",
        "embedded": {"@class": "Foo", "name": "Foo"}
      }
      return this.db.record.create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        }).then((response) => {
          response[0].embedded.should.be.eql({"@class": "Foo", "name": "Foo"});
        });
    });

    it('should create a simple record with embedded strings', function () {
      var record = {
        "@class": "Foo",
        "strings": ["foo", "bar"]
      }
      return this.db.record.create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        }).then((response) => {
          response[0].strings.should.be.eql(["foo", "bar"]);
        });
    });

    it('should create a simple record with embedded numbers', function () {
      var record = {
        "@class": "Foo",
        "numbers": [2, 10]
      }
      return this.db.record.create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        }).then((response) => {
          response[0].numbers.should.be.eql([2, 10]);
        });
    });

    it('should create a simple record with embedded dates', function () {
      var dates = [new Date(), new Date()];
      var record = {
        "@class": "Foo",
        "dates": dates
      }
      return this.db.record.create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        }).then((response) => {
          response[0].dates.should.be.eql(dates);
        });
    });

    it('should create a simple record with embedded mix numbers/strings/date', function () {
      var mix = [2, "Now", new Date()];
      var record = {
        "@class": "Foo",
        "mixes": mix
      }
      return this.db.record.create(record)
        .then(() => {
          return this.db.query("select from Foo").all();
        }).then((response) => {
          response[0].mixes.should.be.eql(mix);
        });
    });
  });

});
