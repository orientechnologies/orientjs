var assert = require("assert"),
    parser = require("../../lib/orientdb/connection/parser");

var sqlsets = parser.hashToSQLSets({});

assert.equal("", sqlsets.sqlsets);
assert.deepEqual({}, sqlsets.remainingHash);

