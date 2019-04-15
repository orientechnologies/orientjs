describe("Bug #4: Create undefined in Myclass.property.create", function() {
  before(
    CAN_RUN(37, function() {
      return CREATE_TEST_DB(this, "testdb_bug_4")
        .bind(this)
        .then(() => {
          return TEST_CLIENT.session({ name: "testdb_bug_4" });
        })
        .then(db => {
          this.db = db;
        })
        .then(function() {
          return Promise.all([
            this.db.class.create("Person", "V"),
            this.db.class.create("HasFriend", "E")
          ]);
        })
        .then(function(item) {
          var script = `
          let v = create vertex Person set id =1;
          let v1 = create vertex Person set id =1;
          let e = create edge HasFriend from $v to $v1;
          return $e;
          `;
          return this.db.batch(script).all();
        })
        .then(function(edge) {
          this.edge = edge[0];
          this.vIn = this.edge.in;
          this.vOut = this.edge.out;
        });
    })
  );
  after(function() {
    return DELETE_TEST_DB("testdb_bug_4");
  });

  it("Should not make dirty links", function() {
    return this.db.record
      .delete(this.edge["@rid"])
      .bind(this)
      .then(function() {
        return Promise.all([
          this.db.record.get(this.vIn),
          this.db.record.get(this.vOut)
        ]);
      })
      .then(function(results) {
        results[0]['in_HasFriend'].size().should.be.eql(0) 
        results[1]['out_HasFriend'].size().should.be.eql(0)      
    });
  });
});
