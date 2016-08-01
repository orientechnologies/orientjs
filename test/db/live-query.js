var Promise = require('bluebird');
describe("Database API - Live Query ", function () {

  this.timeout(20000);
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_live_query')
      .bind(this)

      .then(function () {

        this.db = USE_TOKEN_DB("testdb_live_query");
        return this.db.open();
      }).then(function () {
        this.writeDB = USE_TOKEN_DB("testdb_live_query");
        return this.writeDB.open();
      })
      .then(function () {
        return this.db.class.create('Test', 'V');
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
    return DELETE_TEST_DB('testdb_live_query');
  });


  it('should trigger live query', function (done) {

    var TOTAL = 2;
    var record;
    var count = 0;

    this.db.liveQuery("LIVE SELECT FROM Test").on('live-insert', function (data) {
      count++;
      if (count === TOTAL) {
        data.content.name.should.eql('a');
        done();
      }
    });
    var self = this;
    setTimeout(function () {
      var promises = [];
      for (var i = 0; i < TOTAL; i++) {
        promises.push(self.db.create("VERTEX", "Test")
          .set(
            {
              name: 'a',
              creation: '2001-01-01 00:00:01'
            })
          .one())
      }
      Promise.all(promises).then(function (rec) {
      })
    }, 1000);

  });

});
