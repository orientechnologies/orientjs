var Bluebird = require("bluebird");

describe("Bug: Should create a lightweight edge", function() {
  var first, second, third;
  before(function() {
    return CREATE_TEST_DB(this, "testdb_bug_edge_lightweight")
      .bind(this)
      .then(() => {
        return TEST_CLIENT.session({ name: "testdb_bug_edge_lightweight" });
      })
      .then(db => {
        this.db = db;
        return this.db
          .command("ALTER DATABASE custom useLightweightEdges=true")
          .all();
      })
      .then(function() {
        return Bluebird.all([
          this.db.class.create("Thing", "V"),
          this.db.class.create("Knows", "E")
        ]);
      })
      .spread(function(Thing, Knows) {
        return Bluebird.all([
          Thing.property.create([
            {
              name: "name",
              type: "string"
            }
          ]),
          Knows.property.create([
            {
              name: "referrer",
              type: "link"
            }
          ])
        ]);
      })
      .then(function() {
        return Bluebird.all([
          this.db.command("CREATE VERTEX Thing SET name = 'first'").all(),
          this.db.command("CREATE VERTEX Thing SET name = 'second'").all()
        ]).then(function(results) {
          first = results[0][0];
          second = results[1][0];
        });
      });
  });
  after(function() {
    return DELETE_TEST_DB("testdb_bug_edge_lightweight");
  });
  it("should create a link whilst creating an edge", function() {
    return this.db
      .create("EDGE", "Knows")
      .from(first["@rid"])
      .to(second["@rid"])
      .one()
      .then(function(result) {
        // It's lightweight edge
        result["@rid"].position.should.be.eql(-1);
        result["@rid"].cluster.should.be.eql(-1);
      });
  });
});
