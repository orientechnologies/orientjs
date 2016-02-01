//describe("Database API - Batch Script", function () {
//  before(function () {
//    return CREATE_TEST_DB(this, 'testdb_batch_script')
//      .bind(this)
//  });
//  after(function () {
//    return DELETE_TEST_DB('testdb_batch_script');
//  });
//
//
//  it('should create Vertex with strange characters [1/2]', function () {
//
//    var val = "test \" test )";
//    return this.db
//      .let('myVertex', function (v) {
//        v.create("VERTEX", "V")
//          .set({
//            msg: val
//          });
//      })
//      .commit()
//      .return('$myVertex')
//      .all()
//      .then(function (res) {
//        res[0].msg.should.eql(val);
//      });
//  });
//  it('should create Vertex with strange characters [2/2]', function () {
//
//    var val = '";"';
//    return this.db
//      .let('myVertex', function (v) {
//        v.create("VERTEX", "V")
//          .set({
//            msg: val
//          });
//      })
//      .commit()
//      .return('$myVertex')
//      .all()
//      .then(function (res) {
//        res[0].msg.should.eql(val);
//      });
//  });
//
//
//});
