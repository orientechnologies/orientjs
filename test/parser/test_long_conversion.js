var assert = require("assert"),
    parser = require("../../lib/orientdb/connection/parser");

function assertBufferContainsLong(long, buf) {
    for (var longIdx = 0, bufIdx = 0; longIdx < long.length; longIdx += 2, bufIdx++) {
        if (parseInt(long[longIdx] + long[longIdx + 1], 16) !== buf[bufIdx]) {
            console.log("Expected - Found");
            console.log(long);
            console.log(buf);
            throw new Error();
        }
    }
}

var buf;

buf = parser.writeLong(0);
assertBufferContainsLong("0000000000000000", buf);

buf = parser.writeLong(200);
assertBufferContainsLong("00000000000000c8", buf);

buf = parser.writeLong(4294967295);
assertBufferContainsLong("00000000ffffffff", buf);

buf = parser.writeLong(8589934590);
assertBufferContainsLong("00000001fffffffe", buf);

buf = parser.writeLong(-200);
assertBufferContainsLong("ffffffffffffff38", buf);

buf = parser.writeLong(-1);
assertBufferContainsLong("ffffffffffffffff", buf);

buf = parser.writeLong(-4294967295);
assertBufferContainsLong("ffffffff00000001", buf);

buf = parser.writeLong(-8589934590);
assertBufferContainsLong("fffffffe00000002", buf);

assert.equal(0, parser.readLong(parser.writeLong(0), 0));
assert.equal(200, parser.readLong(parser.writeLong(200), 0));
assert.equal(4294967295, parser.readLong(parser.writeLong(4294967295), 0));
assert.equal(8589934590, parser.readLong(parser.writeLong(8589934590), 0));
assert.equal(-200, parser.readLong(parser.writeLong(-200), 0));
assert.equal(-1, parser.readLong(parser.writeLong(-1), 0));
assert.equal(-4294967295, parser.readLong(parser.writeLong(-4294967295), 0));
assert.equal(-8589934590, parser.readLong(parser.writeLong(-8589934590), 0));