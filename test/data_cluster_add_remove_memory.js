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

    var clusterOptions = {
        type: "MEMORY",
        name: "test_memory"
    }

    db.addDataCluster(clusterOptions, function(err, clusterNumber) {

        assert(!err, "Error while adding a data cluster: " + err);

        if (typeof clusterNumber !== "number") {
            throw new Error("The result must be a number value. Received: " + (typeof clusterNumber));
        }

        console.log("New MEMORY cluster with number " + clusterNumber);

        db.removeDataCluster(clusterNumber, function(err) {

            assert(!err, "Error while removing a data cluster: " + err);

            console.log("MEMORY cluster removed");

            db.close();
        });
    });
});

