var assert = require("assert"),
    parser = require("../../lib/orientdb/connection/parser");

var string = "This is a test string (èç€) with some special chars";
var buf = parser.writeString(string);

assert.equal(parser.readString(buf, 0).value, string);
assert.equal(parser.readString(buf, 0).lengthInBytes, string.length + encodeURIComponent(string).match(/%[89ABab]/g).length);

