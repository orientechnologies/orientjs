var assert = require("assert"),
    parser = require("../../lib/orientdb/connection/parser");

var when_millis = 1347608670283;

var hash = {
    name: "federico",
    "@class": "V",
    when: new Date(when_millis),
    bool: true,
    escape: "\"ciao\"",
    embed: {
        key: "value"
    }
};

var sqlsets = parser.hashToSQLSets({});
assert.equal("", sqlsets.sqlsets);
assert.deepEqual({}, sqlsets.remainingHash);

sqlsets = parser.hashToSQLSets(hash);
assert.equal("SET name = \"federico\", @class = \"V\", when = " + when_millis + ", bool = true, escape = \"\\\"ciao\\\"\"", sqlsets.sqlsets);
var expectedRemainigHash = {
    embed: {
        key: "value"
    }
};

assert.deepEqual(expectedRemainigHash, sqlsets.remainingHash);