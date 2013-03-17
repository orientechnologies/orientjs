var assert = require("assert");
var _ = require("lodash");

var db = require("./setup_db.js").db;

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.countRecords(function(err, count) {

        assert(!err, "Error while counting records: " + err);

        assert(_.isNumber(count), "The result must be a boolean value. Received: " + count);

        console.log("Record count: " + count);

        db.close();
    });
});

