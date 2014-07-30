describe("Bug #82: db.query errors when parsing emojis ", function () {
  var rid;
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_82')
    .bind(this)
    .then(function () {
      return this.db.class.create('Emoji');
    })
    .then(function (item) {
      this.class = item;
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_82');
  });

  it('should allow emojis in insert statements', function () {
    return this.db.insert().into('Emoji').set({value: '😢😂😭'}).one()
    .then(function (result) {
      result.should.have.property('@rid');
      rid = result['@rid'];
    });
  });
  it('should allow emojis in update statements', function () {
    return this.db.update(rid).set({value: 'hello 😢😂😭', foo: 'bar'}).one();
  });

  it('should allow emojis using db.query() directly', function () {
    var query = 'UPDATE #5:0 SET bio="😢😂"';
    return this.db.query(query)
    .bind(this)
    .spread(function (result) {
      result.should.eql(1);
      return this.db.query('SELECT * FROM #5:0');
    })
    .spread(function (result) {
      result.bio.should.equal("😢😂");
    });
  });
});
