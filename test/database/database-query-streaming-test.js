var Query = require("../../lib/client/database/database-query");

describe("ODatabaseSession API - Query", function() {
  before(
    CAN_RUN(37, function() {
      return CREATE_DB("test_session_streaming")
        .then(() => {
          return TEST_CLIENT.session({ name: "test_session_streaming" });
        })
        .then(db => {
          this.db = db;

          let elements = [...Array(10).keys()].map((elem) => {
            return {
              "@class": "V",
              id: elem
            };
          });
          
          return this.db.record.create(elements);
        });
    })
  );
  after(
    CAN_RUN_AFTER(37, function() {
      return DROP_DB("test_session_streaming");
    })
  );

  beforeEach(function() {
    this.query = new Query(this.db);
  });

  describe("ODatabase::query::subscribe()", function() {
    it("should execute a query with page size custom", function(done) {
      var results = [];
      return this.db
        .query("select from OUSer", {
          pageSize: 1
        })
        .on("data", record => {
          results.push(record);
        })
        .on("end", () => {
          results.length.should.be.eql(3);
          done();
        });
    });
    it("should execute a query with page size custom and params", function(done) {
      var results = [];
      return this.db
        .query("select from OUSer where name =:name", {
          pageSize: 1,
          params: {
            name: "admin"
          }
        })
        .on("data", record => {
          results.push(record);
        })
        .on("end", () => {
          results.length.should.be.eql(1);
          done();
        });
    });
  });

  describe("ODatabase::queryBuilder::stream()", function() {
    it("should return one record with stream and limit", function(done) {
      var user;
      var size = 0;
      this.query
        .select()
        .from("OUser")
        .limit(1)
        .stream()
        .on("data", response => {
          user = response;
          size++;
        })
        .on("error", err => {})
        .on("end", () => {
          size.should.be.eql(1);
          Array.isArray(user).should.be.false;
          user.should.have.property("name");
          done();
        });
    });
    it("should return one record with stream and params", function(done) {
      var user;
      var size = 0;
      this.query
        .select()
        .from("OUser")
        .where("name = :name")
        .stream({ name: "admin" })
        .on("data", response => {
          user = response;
          size++;
        })
        .on("error", err => {})
        .on("end", () => {
          size.should.be.eql(1);
          Array.isArray(user).should.be.false;
          user.should.have.property("name");
          user.name.should.equal("admin");
          done();
        });
    });

    it("should return one record per page with stream and page size", function(done) {
      var users = [];
      var size = 0;
      this.query
        .select()
        .from("OUser")
        .stream(
          { name: "admin" },
          {
            pageSize: 1
          }
        )
        .on("data", response => {
          users.push(response);
          size++;
        })
        .on("error", err => {})
        .on("end", () => {
          size.should.be.eql(3);
          done();
        });
    });

    it("should return one record with stream and page size and early stream close", function(done) {
      var users = [];
      var size = 0;
      var stream = this.db
        .query("select from OUSer", {
          pageSize: 2
        })
        .on("data", response => {
          stream.close();
          size++;
        })
        .on("error", err => {})
        .on("end", () => {
          size.should.be.eql(1);
          done();
        });
    });

    it("should return 3 record with stream pause and resume", function(done) {
      var size = 0;
      var buffered = false;
      var stream = this.db
        .query("select from OUSer", {
          pageSize: 1
        })
        .on("data", response => {
          buffered = buffered || stream._readableState.buffer.length > 0;
          size++;
          if (size === 1) {
            stream.pause();
            setTimeout(() => {
              paused = false;
              stream.resume();
            }, 500);
          }
        })
        .on("error", err => {})
        .on("end", () => {
          size.should.be.eql(3);
          buffered.should.be.eql(false);
          done();
        });
    });

    it("should return 10 record with stream pause and resume", function(done) {
      var size = 0;
      var buffered = false;
      var stream = this.db
        .query("select from V", {
          pageSize: 1
        })
        .on("data", response => {
          buffered = buffered || stream._readableState.buffer.length > 0;
          size++;
          if (size === 5) {
            stream.pause();
            setTimeout(() => {
              stream.resume();
            }, 500);
          }
        })
        .on("error", err => {})
        .on("end", () => {
          size.should.be.eql(10);
          buffered.should.be.eql(false);
          done();
        });
    });

    it("should return 3 record with stream pause and resume at every event", function(done) {
      var size = 0;
      var stream = this.db
        .query("select from OUSer", {
          pageSize: 1
        })
        .on("data", response => {
          size++;
          stream.pause();
          setTimeout(() => {
            stream.resume();
          }, 100);
        })
        .on("error", err => {})
        .on("end", () => {
          size.should.be.eql(3);
          done();
        });
    });
  });
});
