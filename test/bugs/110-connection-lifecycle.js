var Statement = require('../../lib/db/statement');

describe("Bug #110: Connection lifecycle", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_110');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_110');
  });
  it('should not crash if the connection is interrupted', function () {
    var promise = this.db.class.list();
    this.db.server.transport.connection.socket.emit('error', {errnum: 100, message: 'ENETDOWN'});
    return promise
    .bind(this)
    .then(function (classes) {
      return this.db.record.get('#5:0');
    })
    .then(function (rec) {
      var promise = this.db.record.get('#5:1');
      this.db.server.transport.connection.socket.emit('error', {errnum: 104, message: 'ECONNRESET'});
      return promise;
    })
    .then(function (rec) {
      (rec['@rid']+'').should.equal('#5:1');
    });
  });
});