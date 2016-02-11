//var Promise = require('bluebird');
//
//describe("Database Distributed API ", function () {
//  this.timeout(4000);
//  before(function () {
//    return USE_DISTRIBUTED_TEST_DB(this, 'GratefulDeadConcerts').then(function () {
//      console.log("Shutdown a node...")
//      return DISTRIBUTED_TEST_SERVER.shutdown();
//    })
//  });
//  after(function () {
//    return;
//  });
//
//  it('should switch server ', function () {
//    var queries = [];
//    var self = this;
//    var length = 0;
//    for (var i = 0; i < 10; ++i) {
//      queries.push(self.db.select().from('OUser').all());
//    }
//    return Promise.all(queries).then(function (results) {
//      length += results.length;
//      length.should.eql(10);
//    })
//
//  })
//});
