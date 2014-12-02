var dbSessionId = -1,
    dataCluster = -1,
    dataSegment = -1,
    serverCluster = {},
    recordId = null;

// @fixme these tests are extremely co-dependent
// if you get a load of test errors, fix the first one first!

describe("Database Operations", function () {
  describe('db-create', function () {
    it('should create a database', function () {
      return TEST_SERVER.send('db-create', {
        name: 'testdb_tmp',
        storage: 'memory',
        type: 'graph',
        username: TEST_SERVER_CONFIG.username,
        password: TEST_SERVER_CONFIG.password
      });
    });
  });
  describe('db-list', function () {
    it("should return a list of databases", function () {
      return TEST_SERVER.send('db-list')
      .then(function (response) {
        Object.keys(response.databases).length.should.be.above(0);
      });
    })
  });
  describe('db-exists', function () {
    it("should return false for missing databases", function () {
      return TEST_SERVER.send('db-exists', {
        name: 'a_non_existant_database',
        storage: 'memory'
      })
      .then(function (response) {
        response.exists.should.be.false;
      });
    });
    it("should return true for existing databases", function () {
      return TEST_SERVER.send('db-exists', {
        name: 'testdb_tmp',
        storage: 'memory'
      })
      .then(function (response) {
        response.exists.should.be.true;
      });
    });
  });
  describe('db-open', function () {
    it("should open a database", function () {
      return TEST_SERVER.send('db-open', {
        sessionId: -1,
        name: 'testdb_tmp',
        type: 'graph',
        username: 'admin',
        password: 'admin'
      })
      .then(function (response) {
        response.sessionId.should.be.above(0);
        response.sessionId.should.not.equal(TEST_SERVER.sessionId);
        response.totalClusters.should.be.above(0);
        response.clusters.length.should.equal(response.totalClusters);
        dbSessionId = response.sessionId;
        serverCluster = response.serverCluster;
      });
    });
  });
  describe('db-size', function () {
    it("should get the size of a database", function () {
      return TEST_SERVER.send('db-size', {
        sessionId: dbSessionId
      })
      .then(function (response) {
        response.size.should.be.above(0);
      });
    });
  });
  describe('db-countrecords', function () {
    it("should get the number of records in a database", function () {
      return TEST_SERVER.send('db-countrecords', {
        sessionId: dbSessionId
      })
      .then(function (response) {
        response.count.should.be.above(0);
      });
    });
  });
  describe('db-reload', function () {
    it("should reload the data for a database", function () {
      return TEST_SERVER.send('db-reload', {
        sessionId: dbSessionId
      })
      .then(function (response) {
        response.totalClusters.should.be.above(0);
        response.clusters.length.should.equal(response.totalClusters);
      });
    });
  });
  describe('datacluster-add', function () {
    it("should add a data cluster", function () {
      return TEST_SERVER.send('datacluster-add', {
        sessionId: dbSessionId,
        location: 'physical',
        name: 'testcluster'
      })
      .then(function (response) {
        response.id.should.be.above(0);
        dataCluster = response.id;
      });
    });
  });
  describe('record-create', function () {
    it("should create a record", function () {
      return TEST_SERVER.send('record-create', {
        sessionId: dbSessionId,
        cluster: 1,
        record: {
          name: 'Charles',
          email: 'charles@codemix.com'
        }
      })
      .then(function (response) {
        response.position.should.be.above(-1);
        response.version.should.be.above(-1);
        recordId = new LIB.RID({
          cluster: 1,
          position: response.position
        })
      });
    });
  });
  describe('command', function () {
    it("should execute a query command", function () {
      return TEST_SERVER.send('command', {
        sessionId: dbSessionId,
        class: 'com.orientechnologies.orient.core.sql.query.OSQLSynchQuery',
        limit: 2,
        query: 'SELECT * FROM OUser',
        mode: 's'
      })
      .then(function (response) {
        response.results.length.should.equal(1); // wrapper
        response.results[0].type.should.equal('l'); // collection
        response.results[0].content.length.should.equal(2); // real results
      });
    });
    it("should execute a create class command", function () {
      return TEST_SERVER.send('command', {
        sessionId: dbSessionId,
        class: 'com.orientechnologies.orient.core.sql.OCommandSQL',
        query: 'CREATE CLASS TestClass',
        mode: 's'
      })
      .then(function (response) {
        response.should.have.property('results');
      });
    });
  });
  describe('record-metadata', function () {
    it("should retreive the metadata for a record", function () {
      return TEST_SERVER.send('record-metadata', {
        sessionId: dbSessionId,
        cluster: recordId.cluster,
        position: recordId.position
      })
      .then(function (response) {
        response.version.should.be.above(-1);
      });
    });
  });
  describe('record-load', function () {
    it("should load a record", function () {
      return TEST_SERVER.send('record-load', {
        sessionId: dbSessionId,
        cluster: recordId.cluster,
        position: recordId.position
      })
      .then(function (response) {
        response.records.length.should.equal(1);
        response.records[0]['@version'].should.be.above(-1);
      });
    });
    it("should load a record with a fetch plan", function () {
      return TEST_SERVER.send('record-load', {
        sessionId: dbSessionId,
        cluster: 5,
        position: 0,
        fetchPlan: '*:-1'
      })
      .then(function (response) {
        response.records.length.should.be.above(1);
      });
    });
  });
  describe('record-update', function () {
    it("should update a record", function () {
      return TEST_SERVER.send('record-update', {
        sessionId: dbSessionId,
        cluster: recordId.cluster,
        position: recordId.position,
        record: {
          name: 'Charles P'
        }
      })
      .then(function (response) {
        response.version.should.be.above(0);
      });
    });
  });

 describe('record-clean-out', function () {
  before(function () {
    return TEST_SERVER.send('record-create', {
      sessionId: dbSessionId,
      cluster: 1,
      record: {
        name: 'Test',
        email: 'test@test.com'
      }
    })
    .bind(this)
    .then(function (response) {
      this.recordId = new LIB.RID({
        cluster: 1,
        position: response.position
      })
    });
  });
  it("should clean-out a record", function () {
    return TEST_SERVER.send('record-clean-out', {
      sessionId: dbSessionId,
      cluster: this.recordId.cluster,
      position: this.recordId.position,
    })
    .then(function (response) {
      response.success.should.be.true;
    });
  });
});
  describe('record-delete', function () {
    it("should delete an existing record", function () {
      return TEST_SERVER.send('record-delete', {
        sessionId: dbSessionId,
        cluster: recordId.cluster,
        position: recordId.position,
      })
      .then(function (response) {
        response.success.should.be.true;
      });
    });
    it("should not delete a missing record", function () {
      return TEST_SERVER.send('record-delete', {
        sessionId: dbSessionId,
        cluster: recordId.cluster,
        position: recordId.position + 9999,
      })
      .then(function (response) {
        response.success.should.be.false;
      });
    });
  });
  describe('datacluster-count', function () {
    it("should count records in a data cluster", function () {
      return TEST_SERVER.send('datacluster-count', {
        sessionId: dbSessionId,
        id: dataCluster
      })
      .then(function (response) {
        response.count.should.equal(0);
      });
    });
  });
  describe('datacluster-datarange', function () {
    it("should get the range of record ids in a data cluster", function () {
      return TEST_SERVER.send('datacluster-datarange', {
        sessionId: dbSessionId,
        id: dataCluster
      })
      .then(function (response) {
        response.begin.should.equal(-1);
        response.end.should.equal(-1);
      });
    });
  });
  describe('datacluster-drop', function () {
    it("should remove a data cluster", function () {
      return TEST_SERVER.send('datacluster-drop', {
        sessionId: dbSessionId,
        id: dataCluster
      })
      .then(function (response) {
        response.should.have.property('success');
      });
    });
  });
  describe('db-close', function () {
    it("should close a database", function () {
      return TEST_SERVER.send('db-close', {
        sessionId: dbSessionId
      });
    });
  });
  describe('db-delete', function () {
    it('should delete a database', function () {
      return TEST_SERVER.send('db-delete', {
        name: 'testdb_tmp',
        storage: 'memory',
        username: TEST_SERVER_CONFIG.username,
        password: TEST_SERVER_CONFIG.password
      });
    });
  })
});