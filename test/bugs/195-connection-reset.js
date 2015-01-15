var Bluebird = require('bluebird');

describe.skip("Bug #195: hang on connection reset", function () {
  var rid;
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_195', 'plocal');
  });
  after(function () {
    // return DELETE_TEST_DB('testdb_bug_195', 'plocal');
  });

  it('should not hang on connection reset', function () {
    var self = this;
    this.timeout(10000);
    return this.db.select().from('OUser').all()
    .then(function () {
      console.log('Quick, go restart orientdb');
      return Bluebird.delay(4000);
    })
    .then(function () {
      console.log('Assuming orientdb was restarted, trying to query again.');
      return self.db.select().from('OUser').all();
    })
    .then(function (users) {
      console.log('end', users);
      users.length.should.be.above(1);
    });
  });
});
