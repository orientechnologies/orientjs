var Promise = require("bluebird");
var Errors = require("../../lib/errors");
describe("ODatabase API - Live Query ", function() {
  before(
    CAN_RUN(37, function() {
      return CREATE_DB("test_session_api_query")
        .bind(this)
        .then(function() {
          return TEST_CLIENT.open({ name: "test_session_api_query" });
        })
        .then(function(session) {
          this.session = session;
          return this.session.class.create("Test", "V");
        })
        .then(function(item) {
          this.class = item;
          return this.class.property.create([
            {
              name: "name",
              type: "String"
            },
            {
              name: "creation",
              type: "DateTime"
            }
          ]);
        })
        .then(function() {
          return this.class.create([
            {
              name: "a",
              creation: "2001-01-01 00:00:01"
            },
            {
              name: "b",
              creation: "2001-01-02 12:00:01"
            },
            {
              name: "c",
              creation: "2009-01-01 00:12:01"
            },
            {
              name: "d",
              creation: "2014-09-01 00:01:01"
            },
            {
              name: "e",
              creation: "2014-09-01 00:24:01"
            }
          ]);
        });
    })
  );
  after(function() {
    return DELETE_TEST_DB("test_session_api_query");
  });

  it("should subscribe/unSubscribe live query", function(done) {
    let live = this.session
      .liveQuery("LIVE SELECT FROM Test")
      .on("data", () => {
        throw new Error("Should never happen!");
      })
      .on("error", err => {
        throw new Error("Should never happen!");
      })
      .on("end", () => {
        done();
      });

    setTimeout(() => {
      live.unsubscribe();
    }, 500);
  });

  it("should trigger live query create", function(done) {
    var TOTAL = 2;
    var count = 0;
    let liveQuery = this.session
      .liveQuery("LIVE SELECT FROM Test")
      .on("data", live => {
        count++;
        live.operation.should.eql(1);
        live.data.name.should.eql("a");
        if (count === TOTAL) {
          liveQuery.unsubscribe();
        }
      })
      .on("error", () => {
        throw new Error("Should never happen!");
      })
      .on("end", () => {
        done();
      });
    var self = this;
    setTimeout(function() {
      var promises = [];
      for (var i = 0; i < TOTAL; i++) {
        promises.push(
          self.session
            .create("VERTEX", "Test")
            .set({
              name: "a",
              creation: "2001-01-01 00:00:01"
            })
            .one()
        );
      }
      Promise.all(promises).then(function(rec) {});
    }, 1000);
  });

  it("should trigger live query updated", function(done) {
    this.session
      .create("VERTEX", "Test")
      .set({
        name: "a",
        creation: "2001-01-01 00:00:01"
      })
      .one()
      .then(record => {
        let liveQuery = this.session
          .liveQuery("LIVE SELECT FROM Test")
          .on("data", live => {
            live.operation.should.eql(2);
            live.data.name.should.eql("b");
            live.before.name.should.eql("a");
            liveQuery.unsubscribe();
          })
          .on("error", () => {
            throw new Error("Should never happen!");
          })
          .on("end", () => {
            done();
          });

        var self = this;
        setTimeout(function() {
          record.name = "b";
          self.session.record.update(record).then(updated => {});
        }, 1000);
      });
  });

  it("should trigger live query deleted", function(done) {
    this.session
      .create("VERTEX", "Test")
      .set({
        name: "a",
        creation: "2001-01-01 00:00:01"
      })
      .one()
      .then(record => {
        let liveQuery = this.session
          .liveQuery("LIVE SELECT FROM Test")
          .on("data", live => {
            live.operation.should.eql(3);
            live.data.name.should.eql("a");
            liveQuery.unsubscribe();
          })
          .on("error", () => {
            throw new Error("Should never happen!");
          })
          .on("end", () => {
            done();
          });

        var self = this;
        setTimeout(function() {
          self.session.record.delete(record).then(updated => {});
        }, 1000);
      });
  });

  it("should trigger live query error", function(done) {
    this.session
      .liveQuery("LIVE SELECT FROM Test2")
      .on("data", () => {
        throw new Error("Should never happen!");
      })
      .on("error", err => {
        err.should.be.an.instanceOf(Errors.RequestError);
        done();
      })
      .on("end", () => {
        throw new Error("Should never happen!");
      });
  });
});
