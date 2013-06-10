var assert = require("assert"),
    parser = require("../../lib/orientdb/connection/parser");

var hash = { config: { modules: { mod2: 'modval2' } } };

var expectedResult = "";
var expectedRemainigHash = hash;

var sqlsets = parser.hashToSQLSets(hash);
assert.equal(expectedResult, sqlsets.sqlsets);

assert.deepEqual(expectedRemainigHash, sqlsets.remainingHash);

