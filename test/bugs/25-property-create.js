describe("Bug #25: Create undefined in Myclass.property.create", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_25')
    .bind(this)
    .then(function () {
      return this.db.class.create('Member', 'V');
    })
    .then(function (item) {
      this.class = item;
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_25');
  });

  it('Let me create a property immediately after creating a class', function () {
    var values = {
      name: 'name',
      type: 'String',
      mandatory: true,
      max: 65
    };
    return this.class.property.create(values)
    .then(function (prop) {
      prop.should.have.properties(values);
    })
  });
});