describe("Bug #69: Order by date", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_69')
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
          name: 'creation',
          type: 'DateTime'
        }
      ]);
    })
    .then(function () {
      return this.class.create([
        {
          name: 'a',
          creation: '2001-01-01 00:00:01'
        },
        {
          name: 'b',
          creation: '2001-01-02 12:00:01'
        },
        {
          name: 'c',
          creation: '2009-01-01 00:12:01'
        },
        {
          name: 'd',
          creation: '2014-09-01 00:01:01'
        },
        {
          name: 'e',
          creation: '2014-09-01 00:24:01'
        }
      ])
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_69');
  });

  it('should order by date', function () {
    var query = this.db.select().from('Member').order('creation desc');
    return query.all()
    .map(function (result) {
      return result.name;
    })
    .then(function (results) {
      results.should.eql(['e', 'd', 'c', 'b', 'a']);
    });
  });
});
