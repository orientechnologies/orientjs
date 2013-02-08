var assert = require("assert");
var _ = require("lodash");

var db = require("./test_db.js").db;

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.size(function(err, size) {

        assert(!err, "Error while retrieving the size of the database: " + err);

        assert(_.isNumber(size), "The result must be a numeric value. Received: " + size);

        console.log("Database size: " + size);

        db.close();
    });
});

