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
    var date = new Date();
    utils.prepare("select from index:foo where date = :date", {date: date}).should.equal("select from index:foo where date = " + date.getTime());
  });
});