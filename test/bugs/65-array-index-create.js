describe("Bug #65: Passing JSON array to db.index.create", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_65')
    .bind(this)
    .then(function () {
      return this.db.class.create('Member', 'V');
    })
    .then(function (item) {
      this.class = item;
      return this.class.property.create([
        {
          name: 'name',
          type: 'String'
        },
        {
          name: 'altName',
          type: 'String'
        }
      ]);
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_65');
  });

  it('Let me create multiple indices at once', function () {
    return this.db.index.create([
      {
        name: 'Member.name',
        type: 'unique'
      },
      {
        name: 'Member.altName',
        type: 'unique'
      }
    ]);
  });
});
