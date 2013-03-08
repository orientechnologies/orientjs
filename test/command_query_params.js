var assert = require("assert");
var _ = require("lodash");

var db = require("./test_db.js").db;

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.query("SELECT FROM OUser where name = :name", { params: { name: "admin" } }, function(err, results) {

        assert(!err, "Error while executing a SELECT command: " + err);

        assert.equal(results.length, 1);

        var admin = results[0];
        assert(_.isString(admin["@rid"]));

        console.log("Received results: " + JSON.stringify(results));

        db.query("SELECT FROM OUser where name = :name", { fetchPlan: "*:-1", params: { name: "admin" } }, function(err, results) {

            assert(!err, "Error while executing a SELECT command: " + err);

            assert.equal(results.length, 1);

            var admin = results[0];
            assert(_.isString(admin["@rid"]));

            console.log("Received results: " + JSON.stringify(results));

            db.query("SELECT FROM OUser where name = ?", { params: [ "admin" ] }, function(err, results) {

                assert(!err, "Error while executing a SELECT command: " + err);

                assert.equal(results.length, 1);

                var admin = results[0];
                assert(_.isString(admin["@rid"]));

                console.log("Received results: " + JSON.stringify(results));

                db.query("SELECT FROM OUser where name = ?", { fetchPlan: "*:-1", params: [ "admin" ] }, function(err, results) {

                    assert(!err, "Error while executing a SELECT command: " + err);

                    assert.equal(results.length, 1);

                    var admin = results[0];
                    assert(_.isString(admin["@rid"]));

                    console.log("Received results: " + JSON.stringify(results));

                    db.close();
                });
            });
        });
    });
});

