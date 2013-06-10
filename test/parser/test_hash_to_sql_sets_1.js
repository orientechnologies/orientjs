var assert = require("assert"),
    parser = require("../../lib/orientdb/connection/parser");

var hash = {
    name: "federico",
    "@class": "V",
    when: new Date(1347608670283),
    bool: true,
    escape: "\"ciao\"",
    embed: {
        key: "value"
    }
};

var expectedResult = "SET name = \"federico\", @class = \"V\", when = date(\"2012-09-14T07:44:30.283Z\", \"yyyy-MM-dd\'T\'HH:mm:ss.SSS'Z'\"), bool = true, escape = \"\\\"ciao\\\"\"";
var expectedRemainigHash = {
    embed: {
        key: "value"
    }
};

var sqlsets = parser.hashToSQLSets(hash);
assert.equal(expectedResult, sqlsets.sqlsets);
assert.deepEqual(expectedRemainigHash, sqlsets.remainingHash);
