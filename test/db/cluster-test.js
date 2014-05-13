describe("Database API - Cluster", function () {
  before(function () {
    return TEST_SERVER.create({
      name: 'testdb_dbapi_cluster',
      type: 'graph',
      storage: 'memory'
    })
    .bind(this)
    .then(function (db) {
      this.db = db;
    });
  });
  after(function () {
    return TEST_SERVER.drop({
      name: 'testdb_dbapi_cluster',
      storage: 'memory'
    });
  });

  describe('Db::cluster.list()', function () {
    it('should list the clusters in the database', function () {
      return this.db.cluster.list()
      .then(function (clusters) {
        clusters.length.should.be.above(0);
      });
    });
  });

  describe('Db::cluster.getByName()', function () {
    it('should get the cluster with the given name', function () {
      return this.db.cluster.getByName('ouser')
      .then(function (cluster) {
        cluster.name.should.equal('ouser');
      });
    });
  });

  describe('Db::cluster.getById()', function () {
    it('should get the cluster with the given id', function () {
      return this.db.cluster.getById(5)
      .then(function (cluster) {
        cluster.id.should.eql(5);
      });
    });
  });

  describe('Db::cluster.get()', function () {
    it('should get the cluster with the given id', function () {
      return this.db.cluster.get(5)
      .then(function (cluster) {
        cluster.id.should.eql(5);
      });
    });

    it('should get the cluster with the given name', function () {
      return this.db.cluster.get('ouser')
      .then(function (cluster) {
        cluster.name.should.equal('ouser');
      });
    });
  });

  describe('Db::cluster.create()', function () {
    it('should create a cluster with the given name', function () {
      return this.db.cluster.create('mycluster');
    });
  });

  describe('Db::cluster.count()', function () {
    it('should count the records in a cluster with the given name', function () {
      return this.db.cluster.count('ouser')
      .then(function (count) {
        count.should.be.above(0);
      });
    });
  });


  describe('Db::cluster.range()', function () {
    it('should get the data range in a cluster', function () {
      return this.db.cluster.range('ouser')
      .then(function (range) {
        range.start.should.be.above(-1);
        range.end.should.be.above(0);
      });
    });
  });

  describe('Db::cluster.drop()', function () {
    it('should delete a cluster with the given name', function () {
      return this.db.cluster.drop('mycluster');
    });
  });

});
