var assert = require("assert");
var _ = require("lodash");

var db = require("./setup_db.js").db;

var LONG_STRING_LENGTH = 100000;


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    // create one class for this test
    db.command("CREATE CLASS TestLongValues", function(err, results) {

        assert(!err, "Error while executing a CREATE CLASS command: " + JSON.stringify(err));
        assert.equal(results.length, 1, "The ID of the created class should be returned.");

        console.log("Class TestLongValues created with ID: " + results[0]);

        // insert a record that will be later updated to a long string
        db.command("INSERT INTO TestLongValues (val) values ('')", function(err, results) {

            assert(!err, "Error while executing an INSERT command: " + err);
            assert.equal(results.length, 1, "The inserted user should be returned.");

            var user = results[0];

            console.log("Inserted record: " + JSON.stringify(user));

            var longString = createLongString(LONG_STRING_LENGTH);

            // update the record to contain a very long string
            db.command("UPDATE TestLongValues SET value = '" + longString + "'", function(err, results) {

                assert(!err, "Error while executing an UPDATE command: " + err);
                assert.equal(results.length, 1, "The number of modified records should be returned.");

                var count = results[0];

                console.log("Updated " + count + " records: " + LONG_STRING_LENGTH + " bytes");

                // select the long record
                db.command("SELECT FROM TestLongValues", function(err, results) {

                    assert(!err, "Error while executing a SELECT command: " + err);
                    assert.equal(results.length, 1, "There must be only one record returned.");

                    var longRecord = results[0];

                    assert.equal(longRecord.value.length, LONG_STRING_LENGTH, "The returned value must have the same length as the inserted one.");
                    console.log("Received " + results.length + " long record: " + longRecord.value.length + " bytes");

                    db.command("DROP CLASS TestLongValues", function(err, results) {

                        assert(!err, "Error while executing a DROP CLASS command: " + JSON.stringify(err));
                        assert.equal(results.length, 1, "The result should contain the boolean status of the DROP operation.");

                        console.log("Class dropped.");

                        db.close();
                    });
                });
            });
        });
    });
});

function createLongString(length) {
    var string = "";
    for (var idx = 0; idx < length; idx++) {
        string += ".";
    }
    return string;
}

