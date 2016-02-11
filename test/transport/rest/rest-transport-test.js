var errors = LIB.errors;
var Promise = require('bluebird');

describe("Rest Transport", function () {
  describe('RestTransport::send()', function  () {
    it("should handle errors correctly", function () {
      return REST_SERVER.transport.send('db-open', {
        name: 'not_an_existing_database',
        type: 'graph',
        username: 'admin',
        password: 'admin'
      })
      .then(function (response) {
        throw new Error('Should Not Happen!');
      })
      .catch(errors.Request, function (e) {
        e.message.should.equal('Authorization Error');
        return true;
      });
    })
  });

  describe('REST Operations', function () {
    before(function () {
      return CREATE_TEST_DB(this, 'testdb_rest');
    });
    after(function () {
      return DELETE_TEST_DB('testdb_rest');
    });


    describe('Record Load', function () {
      it('should load a record', function () {
        var params = {
          sessionId: -1,
          database: 'testdb_rest',
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
          database: 'testdb_rest',
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


    describe('Db Open', function () {
      it('should open the database', function () {
        var params = {
          sessionId: -1,
          name: 'testdb_rest',
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


    describe('Command', function () {
      it('should execute a query', function () {
        var config = {
          database: 'testdb_rest',
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
      it('should execute a parameterized query', function () {
        var config = {
          database: 'testdb_rest',
          class: 'com.orientechnologies.orient.core.sql.query.OSQLSynchQuery',
          query: 'SELECT * FROM OUser WHERE name = :name',
          mode: 's',
          limit: -1,
          params: { params: { name: "reader" } }
        };
        return Promise.all([REST_SERVER.send('command', config), this.db.send('command', config)])
        .spread(function (fromRest, fromBinary) {
          fromRest.results.length.should.equal(fromBinary.results.length);
          fromRest.results[0].content.length.should.equal(fromBinary.results[0].content.length);
        }).catch(function (err) {
          console.log("Erorr: ", err.stack || err);
          throw err;
        });
      });
    });


    function pluck (key) {
      return function (item) {
        return item[key];
      }
    }
  });
});
