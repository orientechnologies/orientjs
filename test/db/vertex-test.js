var Class = require('../../lib/db/class');

describe("Database API - Vertex", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_vertex');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_vertex');
  });

  describe("Db::vertex.create()", function () {
    it('should create a vertex', function () {
      return this.db.vertex.create('V')
      .bind(this)
      .then(function (vertex) {
        vertex['@rid'].should.be.an.instanceOf(LIB.RID);
        this.created1 = vertex;
      });
    });
    it('should create a vertex with some attributes', function () {
      return this.db.vertex.create({
        '@class': 'V',
        key1: 'val1',
        key2: 'val2'
      })
      .bind(this)
      .then(function (vertex) {
        vertex['@rid'].should.be.an.instanceOf(LIB.RID);
        vertex.key1.should.equal('val1');
        vertex.key2.should.equal('val2');
        this.created2 = vertex;
      });
    });
  });
  describe("Db::vertex.delete()", function () {
    it('should delete a vertex', function () {
      return this.db.vertex.delete(this.created1)
      .bind(this)
      .then(function (count) {
        count.should.equal(1);
      });
    });
    it('should delete a vertex with properties', function () {
      return this.db.vertex.delete(this.created2)
      .bind(this)
      .then(function (count) {
        count.should.equal(1);
      });
    });
    it('should fail to delete a missing vertex', function () {
      return this.db.vertex.delete("#1:1234567")
      .bind(this)
      .then(function (count) {
        count.should.equal(0);
      });
    });
  });

});