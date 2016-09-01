describe("Bug #82: db.query errors when parsing emojis ", function () {
  var rid;

  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_82')
      .bind(this)
      .then(function () {
        return USE_ODB("testdb_bug_82").open();
      })
      .then(function (db) {
        this.db = db;
        return this.db.class.create('Emoji');
      })
      .then(function (item) {
        this.class = item;
      });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_82');
  });

  IF_ORIENTDB_MAJOR('2.2.0', 'should allow emojis in insert statements', function () {
    return this.db.insert().into('Emoji').set({value: '😢😂😭'}).one()
      .then(function (result) {

        result.should.have.property('@rid');
        rid = result['@rid'];
      });
  });
  IF_ORIENTDB_MAJOR('2.2.0', 'should allow emojis in update statements', function () {
    return this.db.update(rid).set({value: 'hello 😢😂😭', foo: 'bar'}).one();
  });

  IF_ORIENTDB_MAJOR('2.2.0', 'should allow emojis using db.query() directly', function () {
    var query = 'UPDATE #5:0 SET bio="😢😂"';
    return this.db.query(query)
      .bind(this)
      .spread(function (result) {
        result.should.eql('1');
        return this.db.query('SELECT * FROM #5:0');
      })
      .spread(function (result) {
        result.bio.should.equal("😢😂");
      });
  });

  describe('Bug #180: Emoji characters are not saved correctly', function () {
    IF_ORIENTDB_MAJOR('2.2.0', 'should insert some emojis', function () {
      return this.db.insert().into('Emoji').set({value: "testing emoji 💪💦👌"}).one()
        .then(function (result) {
          result.value.should.equal("testing emoji 💪💦👌");
        });
    });
  });

  describe('Bug #134: Emoji characters are not saved correctly', function () {
    IF_ORIENTDB_MAJOR('2.2.0', 'should insert some emojis', function () {

      return this.db.insert().into('Emoji').set({value: "😃💬"}).one()
        .then(function (result) {

          result.value.should.equal("😃💬");
        });
    });
    IF_ORIENTDB_MAJOR('2.2.0', 'should insert some emojis with create from class', function () {
      return this.class.create({value: "😃💬"})
        .then(function (result) {
          result.value.should.equal("😃💬");
        });
    });
  });

});

