var assert = require("assert");
var _ = require("lodash");

var db = require("./setup_db.js").db;

var className = "TestObjectRecord",
    obj = { "one": 1 };

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.command("CREATE CLASS " + className, function(err, results) {

        assert(!err, "Error while executing an INSERT command: " + err);
        assert.equal(results.length, 1, "The new class ID should be returned.");

        console.log("Created class " + className + " with ID: " + results[0]);

        db.command("INSERT INTO " + className + " (obj) values (" + JSON.stringify(obj) + ")", function(err, results) {

            assert(!err, "Error while executing an INSERT command: " + err);
            assert.equal(results.length, 1, "The inserted user should be returned.");

            assert.equal(JSON.stringify(results[0].obj), JSON.stringify(obj), "The inserted object is somehow different from the database result");

            console.log("Inserted object value: " + JSON.stringify(obj));

            db.command("SELECT FROM " + className, function(err, results) {

                assert(!err, "Error while executing a SELECT command: " + err);
                assert.equal(results.length, 1, "Where is the inserted record?");

                assert.equal(JSON.stringify(results[0].obj), JSON.stringify(obj), "Does the database parse object values?");

                console.log("Retrieved object value: " + JSON.stringify(results[0].obj));
                db.close();
            });
        });
    });
});

