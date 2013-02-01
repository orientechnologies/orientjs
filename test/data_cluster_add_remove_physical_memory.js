var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");
var _ = require("lodash");

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

        assert(_.isNumber(physicalClusterNumber), "The result must be a number value. Received: " + physicalClusterNumber);

        console.log("New PHYSICAL cluster with number: " + physicalClusterNumber);

        var clusterOptions = {
            type: "MEMORY",
            name: "test_memory"
        };

        db.addDataCluster(clusterOptions, function(err, memoryClusterNumber) {

            assert(!err, "Error while adding the MEMORY data cluster: " + err);

            assert(_.isNumber(memoryClusterNumber), "The result must be a number value. Received: " + memoryClusterNumber);

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

