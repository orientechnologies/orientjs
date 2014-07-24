var Statement = require('../../lib/db/statement');

describe("Bug #99: Error using .set() with string", function () {

  it('should allow strings to be specified without parentheses', function () {
    var s = new Statement();
    s.update('foo').set('a = 123').toString().should.equal(
      'UPDATE foo SET a = 123'
    );
  });
});