describe("Database API - Cluster", function () {
  before(function (done) {
    TEST_SERVER.create({
      name: 'testdb_dbapi_cluster',
      type: 'document',
      storage: 'memory'
    })
    .bind(this)
    .then(function (db) {
      this.db = db;
      done();
    }, done)
    .done();
  });
  after(function (done) {
    TEST_SERVER.delete({
      name: 'testdb_dbapi_cluster',
      storage: 'memory'
    })
    .bind(this)
    .then(function (db) {
      done();
    }, done)
    .done();
  });

  describe('Db::cluster.list()', function () {
    it('should list the clusters in the database', function (done) {
      this.db.cluster.list()
      .then(function (clusters) {
        clusters.length.should.be.above(0);
        done();
      }, done).done();
    });
  });

  describe('Db::cluster.getByName()', function () {
    it('should get the cluster with the given name', function (done) {
      this.db.cluster.getByName('ouser')
      .then(function (cluster) {
        cluster.name.should.equal('ouser');
        done();
      }, done).done();
    });
  });

  describe('Db::cluster.getById()', function () {
    it('should get the cluster with the given id', function (done) {
      this.db.cluster.getById(5)
      .then(function (cluster) {
        cluster.id.should.eql(5);
        done();
      }, done).done();
    });
  });

  describe('Db::cluster.get()', function () {
    it('should get the cluster with the given id', function (done) {
      this.db.cluster.get(5)
      .then(function (cluster) {
        cluster.id.should.eql(5);
        done();
      }, done).done();
    });

    it('should get the cluster with the given name', function (done) {
      this.db.cluster.get('ouser')
      .then(function (cluster) {
        cluster.name.should.equal('ouser');
        done();
      }, done).done();
    });
  });

  describe('Db::cluster.create()', function () {
    it('should create a cluster with the given name', function (done) {
      this.db.cluster.create('mycluster')
      .then(function (cluster) {
        done();
      }, done).done();
    });
  });

  describe('Db::cluster.count()', function () {
    it('should count the records in a cluster with the given name', function (done) {
      this.db.cluster.count('ouser')
      .then(function (count) {
        count.should.be.above(0);
        done();
      }, done).done();
    });
  });


  describe('Db::cluster.range()', function () {
    it('should get the data range in a cluster', function (done) {
      this.db.cluster.range('ouser')
      .then(function (range) {
        range.start.should.be.above(-1);
        range.end.should.be.above(0);
        done();
      }, done).done();
    });
  });

  describe('Db::cluster.delete()', function () {
    it('should delete a cluster with the given name', function (done) {
      this.db.cluster.delete('mycluster')
      .then(function (cluster) {
        done();
      }, done).done();
    });
  });

});