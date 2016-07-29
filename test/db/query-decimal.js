describe("Database API - Read Decimal", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_read_decimal')
      .bind(this)
      .then(function () {
        return this.db.class.create('TryDec', 'V');
      })
      .then(function (item) {
        this.class = item;
        return this.class.property.create([
          {
            name: 'name',
            type: 'String'
          },
          {
            name: 'dec',
            type: 'DECIMAL'
          }
        ]);
      })
      .then(function () {
        return this.class.create([
          {
            name: 'a',
            dec: 400.405534
          },
          {
            name: 'b',
            dec: -333.05
          },
          {
            name: 'c',
            dec: -333.04
          }
        ])
      });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_read_decimal');
  });


  it('should return a positive decimal', function () {
    var query = this.db.select().from('TryDec').where({name: 'a'});
    return query.one()
      .then(function (res) {
        res.dec.should.eql(400.405534);
      });
  });

  it('should return a negative decimal', function () {
    var query = this.db.select().from('TryDec').where({name: 'b'});
    return query.one()
      .then(function (res) {
        res.dec.should.eql(-333.05);
      });
  });
  it('should return a negative decimal', function () {
    var query = this.db.select().from('TryDec').where({name: 'c'});
    return query.one()
      .then(function (res) {
        res.dec.should.eql(-333.04);
      });
  });
});
