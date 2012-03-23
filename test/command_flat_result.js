var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.command("CREATE CLASS TestFlatResult", function(err, results) {
 
        assert(!err, "Error while executing a CREATE CLASS command: " + JSON.stringify(err));
        assert.equal(results.length, 1, "The ID of the created class should be returned.");

        console.log("Class created with ID: " + results[0]);

        db.command("DROP CLASS TestFlatResult", function(err, results) {
 
            assert(!err, "Error while executing a DROP CLASS command: " + JSON.stringify(err));
            assert.equal(results.length, 1, "The result should contain the boolean status of the DROP operation.");
 
            console.log("Class dropped.");

            db.close();
        });
    });
});

