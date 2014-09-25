var Statement = require('../../lib/db/statement');

describe("Bug #119: Set link field", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_119')
    .bind(this)
    .then(function () {
      return this.db.class.create('SomeClass');
    })
    .then(function (item) {
      this.class = item;
      return this.class.property.create({
        name: 'link',
        type: 'Link'
      });
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_119');
  });
  it('should insert a RID in a link field', function () {
    return this.db
    .insert()
    .into('SomeClass')
    .set({
      nom: 'nom',
      link: new LIB.RID('#5:0')
    })
    .one()
    .then(function (response) {
      response.nom.should.equal('nom');
      response.link.should.be.an.instanceOf(LIB.RID);
    });
  });
});