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
        type: "PHYSICAL",
        name: "test_physical",
        file_name: "a_filename"
    };

    db.addDataCluster(clusterOptions, function(err, physicalClusterNumber) {

        assert(!err, "Error while adding the PHYSICAL data cluster: " + JSON.stringify(err));

        if (typeof physicalClusterNumber !== "number") {
            throw new Error("The result must be a number value. Received: " + (typeof physicalClusterNumber));
        }

        console.log("New PHYSICAL cluster with number: " + physicalClusterNumber);

        var clusterOptions = {
            type: "MEMORY",
            name: "test_memory"
        };

        db.addDataCluster(clusterOptions, function(err, memoryClusterNumber) {

            assert(!err, "Error while adding the MEMORY data cluster: " + err);

            if (typeof memoryClusterNumber !== "number") {
                throw new Error("The result must be a number value. Received: " + (typeof memoryClusterNumber));
            }

            console.log("New MEMORY cluster with number: " + memoryClusterNumber);

            db.removeDataCluster(memoryClusterNumber, function(err) {

                assert(!err, "Error while removing the MEMORY data cluster: " + err);

                console.log("MEMORY cluster removed");

                db.removeDataCluster(physicalClusterNumber, function(err) {

                    assert(!err, "Error while removing the PHYSICAL data cluster: " + err);

                    console.log("PHYSICAL cluster removed");

                    server.disconnect();
                });
            });
        });
    });
});

