var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);

var name = "guest";

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.command("INSERT INTO OUser (name, password) values (\"" + name + "\", \"\")", function(err, results) {

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

