var assert = require("assert");
var _ = require("lodash");

var db = require("./test_db.js").db;

var name = "guest";

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.command("INSERT INTO OUser (name, password, status) values (\"" + name + "\", \"\", \"ACTIVE\")", function(err, results) {

        assert(!err, "Error while executing an INSERT command: " + err);
        assert.equal(results.length, 1, "The inserted user should be returned.");

        var user = results[0];

        assert.equal(user.name, name);
 
        console.log("Inserted record: " + JSON.stringify(user));

        db.command("DELETE FROM OUser WHERE name = \"" + name + "\"", function(err, results) {

            assert(!err, "Error while executing an DELETE command: " + err);
            assert.equal(results.length, 1, "The result should contain the number of deleted records.");

            var num = results[0];

            console.log("Deleted " + num + " record" + (num === "1" ? "" : "s"));

            db.close();
        });
    });
});

