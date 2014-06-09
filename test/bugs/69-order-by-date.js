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
          creation: new Date('2001-01-01')
        },
        {
          name: 'b',
          creation: new Date('2001-01-02')
        },
        {
          name: 'c',
          creation: new Date('2009-01-01')
        },
        {
          name: 'd',
          creation: new Date('2012-01-01')
        },
        {
          name: 'e',
          creation: new Date('2014-09-01')
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
