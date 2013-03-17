var assert = require("assert");
var _ = require("lodash");

var db = require("./setup_db.js").db;

db.open(function(err) {

    assert(!err, "Error while opening the database: " + err);

    db.close(function(err) {

        assert(!err, "Error while closing the database: " + err);

        db.close(function(err) {

            assert(!err, "Error while closing the database: " + err);

            console.log("Closed database");
        });
    });
});

