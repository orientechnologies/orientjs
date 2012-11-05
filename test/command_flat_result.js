var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


var className = "TestFlatResult";

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var classCount = db.classes.length;
    console.log("The databse has " + classCount + " classes.");

    db.command("CREATE CLASS " + className, function(err, results) {

        if (err) {
            assert(!err, "Error while executing a CREATE CLASS command: " + (err.message || JSON.stringify(err)));
        }

        assert.equal(results.length, 1, "The new class count should be returned.");
        assert.equal(classCount, results[0] - 1, "The class count should have been incremented.");
        // TODO check issue: https://github.com/gabipetrovay/node-orientdb/issues/81
        //assert.equal(classCount, db.classes.length - 1, "The Db object classes has not been updated.");

        console.log("Created class " + className);
        console.log("The database has now " + results[0] + " classes.");

        db.command("DROP CLASS " + className, function(err, results) {

            if (err) {
                assert(!err, "Error while executing a DROP CLASS command: " + (err.message || JSON.stringify(err)));
            }

            assert.equal(results.length, 1, "The result should contain the boolean status of the DROP operation.");
            // TODO check issue: https://github.com/gabipetrovay/node-orientdb/issues/81
            //assert.equal(classCount, db.classes.length - 1, "The Db object classes has not been updated.");
 
            console.log("Dropped class " + className);

            db.close();
        });
    });
});

