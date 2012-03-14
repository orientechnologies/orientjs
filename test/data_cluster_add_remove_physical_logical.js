var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

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
    }

    db.addDataCluster(clusterOptions, function(err, physicalClusterNumber) {

        assert(!err, "Error while adding the PHYSICAL data cluster: " + err);

        if (err) { console.log(err); return; }

        if (typeof physicalClusterNumber !== "number") {
            throw new Error("The result must be a number value. Received: " + (typeof physicalClusterNumber));
        }

        console.log("New PHYSICAL cluster with number: " + physicalClusterNumber);

        var clusterOptions = {
            type: "LOGICAL",
            name: "test_logical",
            physical_cluster_container_id: physicalClusterNumber
        }

        db.addDataCluster(clusterOptions, function(err, logicalClusterNumber) {

            assert(!err, "Error while adding the LOGICAL data cluster: " + err);

            if (typeof logicalClusterNumber !== "number") {
                throw new Error("The result must be a number value. Received: " + (typeof logicalClusterNumber));
            }

            console.log("New LOGICAL cluster with number: " + logicalClusterNumber);

            db.removeDataCluster(logicalClusterNumber, function(err) {

                assert(!err, "Error while removing the LOGICAL data cluster: " + err);

                console.log("LOGICAL cluster removed");

                db.removeDataCluster(physicalClusterNumber, function(err) {

                    assert(!err, "Error while removing the PHYSICALL data cluster: " + err);

                    console.log("PHYSICAL cluster removed");

                    server.disconnect();
                });
            });
        });
    });
});

