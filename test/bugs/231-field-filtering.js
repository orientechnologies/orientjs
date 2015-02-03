var Bluebird = require('bluebird');
var Statement = require('../../lib/db/statement');

describe("Bug #231: Field filtering does not handle substitutions", function () {
  var rid, hasProtocolSupport = false;

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
    return CREATE_TEST_DB(this, 'testdb_bug_231')
    .then(function () {
      return Bluebird.map(
        [
          'CREATE CLASS Person EXTENDS V',
          'CREATE CLASS Car EXTENDS V',
          'CREATE CLASS Drives EXTENDS E',

          "CREATE VERTEX Person SET name='Fred'",

          "CREATE VERTEX Car SET make='Volvo', vin = '1234'",
          "CREATE VERTEX Car SET make='Tesla', vin = '5678'",

          "CREATE EDGE Drives FROM (SELECT FROM Person) TO (SELECT FROM Car)"
        ],
        function (text) {
          return self.db.query(text);
        }
      );
    })
    .then(function () {
      return self.db.select('@rid').from('Person').scalar();
    })
    .then(function (result) {
      rid = result;
      hasProtocolSupport = self.db.server.transport.connection.protocolVersion >= 28;
    });
  });

  after(function () {
    return DELETE_TEST_DB('testdb_bug_231');
  });

  it('should substitute parameters in filters', function () {
    var s = new Statement();
    s.select('out(:edge)[val=:value]').from('Person').addParams({edge: "E", value: 123}).toString().should.equal(
      'SELECT out("E")[val=123] FROM Person'
    );
  });


  ifSupportedIt('should select using a normal query', function () {
    return this.db.query("SELECT expand(out(\"Drives\")[vin=\"1234\"]) FROM Person WHERE name = \"Fred\"")
    .spread(function (data) {
      data.vin.should.equal('1234');
    });
  });

  ifSupportedIt('should select using a prepared query', function () {
    return this.db.query("select expand( out( :d )[vin=:v] ) from Person WHERE name = :name", {
      params: {
        d: 'Drives',
        v: '1234',
        name: "Fred"
      }
    })
    .spread(function (data) {
      data.vin.should.equal('1234');
    });
  });


  ifSupportedIt('should select using the query builder', function () {
    var query =  this.db
    .select("expand(out(:d)[vin=:v])")
    .from('Person')
    .where({name: 'Fred'})
    .addParams({
      d: 'Drives',
      v: '1234'
    });

    return query
    .one()
    .then(function (data) {
      data.vin.should.equal('1234');
    });
  });
});