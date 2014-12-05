var Statement = require('../../lib/db/statement');

describe("Bug #155: db.query() parameters substitution fails for string represents number", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_155')
    .bind(this)
    .then(function () {
      return this.db.class.create('SomeClass');
    })
    .then(function (item) {
      this.class = item;
      return this.class.property.create({
        name: 'val',
        type: 'string'
      });
    })
    .then(function () {
      return this.db.insert().into('SomeClass').set({
        val: 123456
      })
      .one();
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_155');
  });
  it('should find by integer value, using query builder', function () {
    return this.db.select().from('SomeClass').where({
      val: 123456
    })
    .one()
    .then(function (doc) {
      doc.val.should.equal('123456');
    });
  });
  it('should find by string value, using query builder', function () {
    return this.db.select().from('SomeClass').where({
      val: '123456'
    })
    .one()
    .then(function (doc) {
      doc.val.should.equal('123456');
    });
  });
  it('should find by integer value, using bound params', function () {
    return this.db.query('SELECT FROM SomeClass WHERE val = :val', {
      params: {
        val: 123456
      }
    })
    .spread(function (doc) {
      doc.val.should.equal('123456');
    });
  });
  it('should find by string value, using bound params', function () {
    return this.db.query('SELECT FROM SomeClass WHERE val = :val', {
      params: {
        val: '123456'
      }
    })
    .spread(function (doc) {
      doc.val.should.equal('123456');
    });
  });
});