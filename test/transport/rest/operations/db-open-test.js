var Promise = require('bluebird');

describe('Rest Operations - Db Open', function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_rest_dbopen');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_rest_dbopen');
  });

  it('should open the database', function () {
    var params = {
      sessionId: -1,
      name: 'testdb_rest_dbopen',
      type: 'graph',
      username: 'admin',
      password: 'admin'
    };
    return Promise.all([REST_SERVER.send('db-open', params), TEST_SERVER.send('db-open', params)])
    .spread(function (fromRest, fromBinary) {
      fromRest.release.should.equal(fromBinary.release);
      fromRest.totalClusters.should.equal(fromBinary.totalClusters);
      fromRest.clusters.length.should.equal(fromBinary.clusters.length);
      fromRest.clusters.map(pluck('name')).sort().should.eql(fromBinary.clusters.map(pluck('name')).sort());
    });
  })
});


function pluck (key) {
  return function (item) {
    return item[key];
  }
}