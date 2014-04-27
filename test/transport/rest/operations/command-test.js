var Promise = require('bluebird');

describe('Rest Operations - Command', function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_rest_command');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_rest_command');
  });

  it('should execute a query', function () {
    var config = {
      database: 'testdb_rest_command',
      class: 'com.orientechnologies.orient.core.sql.query.OSQLSynchQuery',
      limit: 2,
      query: 'SELECT * FROM OUser',
      mode: 's'
    };
    return Promise.all([REST_SERVER.send('command', config), this.db.send('command', config)])
    .spread(function (fromRest, fromBinary) {
      fromRest.results.length.should.equal(fromBinary.results.length);
      fromRest.results[0].content.length.should.equal(fromBinary.results[0].content.length);
    });
  });

});
