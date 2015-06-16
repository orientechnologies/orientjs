'use strict';

var utils = require('../../lib/utils');

describe('utils.prepare', function () {
  it("should prepare SQL statements", function () {
    utils.prepare("select from index:foo").should.equal("select from index:foo");
  });
  it("should prepare SQL statements with parameters", function () {
    utils.prepare("select from index:foo where key = :key", {key: 123}).should.equal("select from index:foo where key = 123");
  });
  it("should prepare SQL statements with date parameters", function () {
    var date = new Date(Date.UTC(2015, 0, 5, 22, 7, 5, 435));
    utils.prepare("select from index:foo where date = :date", {date: date}).should.equal("select from index:foo where date = date(\"2015-01-05 22:07:05.435\", \"yyyy-MM-dd HH:mm:ss.SSS\", \"UTC\")");
  });
});


describe('utils.requiresParens()', function () {
  it('should not require parentheses for string values', function () {
    utils.requiresParens('"foo"').should.be.false;
  });
  it('should not require parentheses for integer values', function () {
    utils.requiresParens('2134').should.be.false;
  });
  it('should not require parentheses for function calls', function () {
    utils.requiresParens('foo("hello", "world")').should.be.false;
  });
  it('should require parentheses for compound expressions with strings', function () {
    utils.requiresParens('"foo" AND "bar"').should.be.true;
  });
  it('should not require parentheses for pre-wrapped compound expressions with strings', function () {
    utils.requiresParens('("foo" AND "bar")').should.be.false;
  });
  it('should require parentheses for compound call expressions', function () {
    utils.requiresParens('foo("hello", "world") AND wat').should.be.true;
    utils.requiresParens('foo("hello", "world") AND bar("wat")').should.be.true;
  });
  it('should not require parentheses for deeply nested function calls', function () {
    utils.requiresParens("foo(1,2,3, bar(4,5,6))").should.be.false;
  });
  it('should require parentheses for separately parenthesized expressions', function () {
    utils.requiresParens("(foo(1,2,3) AND test) AND (a > 2)").should.be.true;
  });
  it('should not require parentheses for strings with parenthesized expressions', function () {
    utils.requiresParens("'foo (a b c) wat'").should.be.false;
  });
  it('should ignore leading and trailing whitespace', function () {
    utils.requiresParens('    ("foo" AND "bar")   ').should.be.false;
  });
});