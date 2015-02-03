var Bluebird = require('bluebird');

describe("Bug #224: REST vs BINARY protocol", function () {
  var rid,
      hasProtocolSupport = false;

  function ifSupportedIt (text, fn) {
    it(text, function () {
      if (hasProtocolSupport) {
        return fn.call(this);
      }
      else {
        console.log('      skipping, "'+text+'": operation not supported by OrientDB version');
      }
    });
  }
  before(function () {
    var self = this;
    return CREATE_TEST_DB(this, 'testdb_bug_224')
    .then(function () {
      return Bluebird.map(
        [
          'CREATE CLASS User extends V',
          'CREATE PROPERTY User.name STRING',

          'CREATE CLASS Post extends V',
          'CREATE PROPERTY Post.message STRING',
          'CREATE PROPERTY Post.score INTEGER',

          'CREATE CLASS WROTES extends E',


          "CREATE VERTEX User SET name='Monica'",

          "CREATE VERTEX Post SET message='My 1st post', score = 1",
          "CREATE VERTEX Post SET message='My 2nd post', score = 2",

          "CREATE EDGE WROTES FROM (SELECT FROM User) TO (SELECT FROM Post)",
        ],
        function (text) {
          return self.db.query(text);
        }
      );
    })
    .then(function () {
      return self.db.select('@rid').from('User').scalar();
    })
    .then(function (result) {
      rid = result;
      hasProtocolSupport = self.db.server.transport.connection.protocolVersion >= 28;
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_224');
  });

  it('should retrieve some records', function () {
    return this.db
    .select()
    .from('User')
    .all()
    .then(function (results) {
      results.length.should.be.above(0);
    });
  });

  ifSupportedIt('should work correctly', function () {
    var query = this.db
    .select('name')
    .select('$DescendingPosts AS Posts')
    .from(rid.toString())
    .let('DescendingPosts', function (s) {
      s
      .select('@rid, message, score')
      .from(function (s) {
        s
        .select('expand(out("WROTES"))')
        .from('$parent.$current');
      })
      .order({
        "score": 'DESC'
      });
    })
    .fetch({Posts: 1});

    return query
    .one()
    .then(function (data) {
      data.name.should.equal('Monica');
      data.Posts.length.should.equal(2);
      data.Posts[0].message.should.equal('My 2nd post');
      data.Posts[1].message.should.equal('My 1st post');
    })
  });
});
