describe("Database API - Query Date", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_query_date')
      .bind(this)
      .then(function () {
        return this.db.class.create('Date', 'V');
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
    return DELETE_TEST_DB('testdb_query_date');
  });


  it('should return a', function () {
    var date = new Date(2001, 0, 1, 0, 0, 1);
    var query = this.db.select().from('Date').where({'creation': date});
    return query.one()
      .then(function (res) {
        res.name.should.eql('a');
      });
  });

  it('should return d and e', function () {
    var query = this.db.select().from('Date').where("creation between '2014-09-01 00:01:00' and '2014-09-01 00:24:02' ");
    return query.all()
      .map(function (res) {
        return res.name;
      })
      .then(function (results) {
        results.should.eql(['d', 'e']);
      });
  });
});
