'use strict';

var utils = require('../../lib/utils');

describe('utils.prepare', function () {
  it("should prepare SQL statements", function () {
    utils.prepare("select from index:foo").should.equal("select from index:foo");
  });
  it("should prepare SQL statements with parameters", function () {
    utils.prepare("select from index:foo where key = :key", {key: 123}).should.equal("select from index:foo where key = 123");
  });
  it('should prepare SQL statements with parameters with tricky values', function () {
    var text = utils.prepare("SELECT * FROM OUser WHERE foo = :foo", {
      foo: '/// TE /// ST \\\\\\'
    });
    text.should.equal('SELECT * FROM OUser WHERE foo = "\\/// TE /// ST \\\\\\\\\\\\"');
  });
  it("should prepare SQL statements with date parameters", function () {
    var date = new Date(Date.UTC(2015, 0, 5, 22, 7, 5));
    utils.prepare("select from index:foo where date = :date", {date: date}).should.equal("select from index:foo where date = date(\"2015-01-05 22:07:05\", \"yyyy-MM-dd HH:mm:ss\", \"UTC\")");
  });
});