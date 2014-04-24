var Promise = require('bluebird');

describe('Rest Operations - Record Load', function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_rest_record_load');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_rest_record_load');
  });

  it('should load a record', function () {
    var params = {
      sessionId: -1,
      database: 'testdb_rest_record_load',
      cluster: 5,
      position: 0
    };
    return Promise.all([REST_SERVER.send('record-load', params), this.db.send('record-load', params)])
    .spread(function (fromRest, fromBinary) {
      fromRest = fromRest.records[0];
      fromBinary = fromBinary.records[0];
      fromRest['@rid'].should.eql(fromBinary['@rid']);
      fromRest['@version'].should.equal(fromBinary['@version']);
      fromRest['@type'].should.equal(fromBinary['@type']);
      fromRest.name.should.equal(fromBinary.name);
      fromRest.status.should.equal(fromBinary.status);
      fromRest.roles.length.should.equal(fromBinary.roles.length);
    });
  });

  it('should load a record with a fetch plan', function () {
    var params = {
      sessionId: -1,
      database: 'testdb_rest_record_load',
      cluster: 5,
      position: 0,
      fetchPlan: 'roles:1'
    };
    return Promise.all([REST_SERVER.send('record-load', params), this.db.send('record-load', params)])
    .spread(function (fromRest, fromBinary) {
      fromRest.records[0]['@rid'].should.eql(fromBinary.records[0]['@rid']);
      fromRest.records[0]['@version'].should.equal(fromBinary.records[0]['@version']);
      fromRest.records[0]['@type'].should.equal(fromBinary.records[0]['@type']);
      fromRest.records[0].name.should.equal(fromBinary.records[0].name);
      fromRest.records[0].status.should.equal(fromBinary.records[0].status);
      fromRest.records[0].roles.length.should.equal(fromBinary.records[0].roles.length);
      fromRest.records[0].roles[0]['@rid'].should.eql(fromBinary.records[0].roles[0]);
      fromRest.records[0].roles[0]['@rid'].should.eql(fromBinary.records[1]['@rid']);
      fromRest.records[0].roles[0].name.should.eql(fromBinary.records[1].name);
    });
  });
});


function pluck (key) {
  return function (item) {
    return item[key];
  }
}