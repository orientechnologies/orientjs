describe("Bug #206: Inserting string value '+' produces error ", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_206')
    .bind(this)
    .then(function () {
      return this.db.class.create('SomeClass', 'V');
    })
    .then(function (item) {
      this.class = item;
      return this.class.property.create({
        name: 'val',
        type: 'String'
      });
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_206');
  });
  it('should insert a "+" sign at the start of a field', function () {
    return this.db.insert().into('SomeClass').set({val: '+hello'}).one()
    .then(function (result) {
      result.val.should.equal('+hello');
    });
  });

  it('should insert a "+" sign as the value of a field', function () {
    return this.db.insert().into('SomeClass').set({val: '+'}).one()
    .then(function (result) {
      result.val.should.equal('+');
    });
  });
});