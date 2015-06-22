var Class = require('../../lib/db/class');

describe("Database API - Edge", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_edge')
    .bind(this)
    .then(function () {
      return this.db.vertex.create([
        {
          name: 'vertex1'
        },
        {
          name: 'vertex2'
        },
        {
          name: 'vertex3'
        },
        {
          name: 'vertex4'
        }
      ]);
    })
    .reduce(function (list, item) {
      list[item.name] = item;
      return list;
    }, {})
    .then(function (vertices) {
      this.vertices = vertices;
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_edge');
  });

  describe("Db::edge.from().to().create()", function () {
    it('should create an edge between individual RIDs', function () {
      return this.db.edge.from(this.vertices.vertex1['@rid']).to(this.vertices.vertex2['@rid']).create()
      .bind(this)
      .then(function (edges) {
        edges.length.should.equal(1);
        edges[0].out.should.eql(this.vertices.vertex1['@rid']);
        edges[0].in.should.eql(this.vertices.vertex2['@rid']);
        expect(edges[0]['@rid']).to.be.undefined;
      });
    });
    it('should create an edge between individual RIDs, with some content', function () {
      return this.db.edge.from(this.vertices.vertex1['@rid']).to(this.vertices.vertex3['@rid']).create({
        key1: 'val1',
        key2: 'val2'
      })
      .bind(this)
      .then(function (edges) {
        edges.length.should.equal(1);
        edges[0].out.should.eql(this.vertices.vertex1['@rid']);
        edges[0].in.should.eql(this.vertices.vertex3['@rid']);
        expect(edges[0]['@rid']).to.not.be.undefined;
        edges[0].key1.should.eql('val1');
        edges[0].key2.should.eql('val2');
      });
    });
    it('should create an edge between lists of RIDs', function () {
      return this.db.edge.from("SELECT FROM V WHERE name = 'vertex1'").to("SELECT FROM V WHERE name = 'vertex2' ").create()
      .then(function (edges) {
        edges.length.should.be.above(0);
      });
    });
  });

  describe("Db::edge.from().to().delete()", function () {
    it('should delete an edge between individual RIDs', function () {
      return this.db.edge.from(this.vertices.vertex1['@rid']).to(this.vertices.vertex2['@rid']).delete()
      .then(function (count) {
        count.should.equal(2);
      });
    });
  });
});
