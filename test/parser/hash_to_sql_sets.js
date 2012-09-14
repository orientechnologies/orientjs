var assert = require("assert"),
    parser = require("../../lib/orientdb/connection/parser");

var when_millis = 1347608670283;

var hash = {
    name: "federico",
    "@class": "V",
    when: new Date(when_millis),
    bool: true,
    escape: "\"ciao\""
};

assert.equal("", parser.hashToSQLSets({}));
assert.equal("SET name = \"federico\", @class = \"V\", when = " + when_millis + ", bool = true, escape = \"\\\"ciao\\\"\"", parser.hashToSQLSets(hash));
