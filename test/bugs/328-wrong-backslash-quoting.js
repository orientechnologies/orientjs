describe("Bug #328: wrong serialization of fields with multiple backslash characters", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_328')
    .bind(this)
    .then(function () {
      return this.db.class.create('TestSerializeBackslash');
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_328');
  });

  it('should insert a document with correct quotes for backslashes', function () {
    return this.db
    .insert()
    .into('TestSerializeBackslash')
    .set({
      foo: 'kratke, , nadherne, proste bozi, chjo som sa ostrihal :\\\\',
      bar: '&gt;'
    })
    .one()
    .then(function (res) {
      res.foo.should.equal('kratke, , nadherne, proste bozi, chjo som sa ostrihal :\\\\');
    });
  });

});
