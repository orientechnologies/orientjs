var Bluebird = require('bluebird');

describe("Bug: Should create a link while inserting an edge", function () {
  var first, second, third;
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_edge_link')
    .bind(this)
    .then(function () {
      return Bluebird.all([
        this.db.class.create('Thing', 'V'),
        this.db.class.create('Knows', 'E')
      ]);
    })
    .spread(function (Thing, Knows) {
      return Bluebird.all([
        Thing.property.create([
          {
            name: 'name',
            type: 'string'
          }
        ]),
        Knows.property.create([
          {
            name: 'referrer',
            type: 'link'
          }
        ])
      ]);
    })
    .then(function () {
      return this.db
      .let('first', "CREATE VERTEX Thing SET name = 'first'")
      .let('second', "CREATE VERTEX Thing SET name = 'second'")
      .let('third', "CREATE VERTEX Thing SET name = 'third'")
      .return(['$first', '$second', '$third'])
      .commit()
      .all()
      .then(function (results) {
        first = results[0];
        second = results[1];
        third = results[2];
      });
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_edge_link');
  });
  it('should create a link whilst creating an edge', function () {
    return this.db
    .create('EDGE', 'Knows')
    .from(first['@rid'])
    .to(second['@rid'])
    .set({
      referrer: third['@rid']
    })
    .one()
    .then(function (result) {
      result.referrer.equals(third['@rid']).should.be.true;
    })
  });


  it('should create a link whilst creating an edge in a transaction', function () {

    var version = this.db.server.transport.connection.protocolVersion;

    var knowsReturn = version >=33 ? '$knows[0]' : "$knows";
    return this.db
    .let('fourth', "CREATE VERTEX Thing SET name = 'fourth'")
    .let('fifth', "CREATE VERTEX Thing SET name = 'fifth'")
    .let('sixth', "CREATE VERTEX Thing SET name = 'sixth'")
    .let('knows', function (s) {
      s
      .create('EDGE', 'Knows')
      .from('$fourth')
      .to('$fifth')
      .set('referrer = first($sixth)')
    })
    .return(['$sixth', knowsReturn])
    .commit()
    .all()
    .spread(function (referrer, edge) {
      edge.referrer.should.equal(referrer);
    });
  });
});