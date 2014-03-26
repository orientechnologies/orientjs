var Class = require('../../lib/db/class');

describe.skip("Database API - Edge", function () {
  before(function (done) {
    CREATE_TEST_DB(this, 'testdb_dbapi_edge')
    .then(done, done)
    .done();
  });
  after(function (done) {
    DELETE_TEST_DB('testdb_dbapi_edge')
    .then(done, done)
    .done();
  });

 describe("Db::edge.from().to().create()", function () {
  it('should create an edge', function (done) {
    return this.db.edge.from('#5:0').to('#5:1').create()
    .then(function (response) {
      console.log(response);
      done();
    }, done)
    .done();
  });
 });

});