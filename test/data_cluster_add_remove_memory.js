var assert = require("assert");
var _ = require("lodash");

var db = require("./test_db.js").db;

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var clusterOptions = {
        type: "MEMORY",
        name: "test_memory"
    };

    db.addDataCluster(clusterOptions, function(err, clusterNumber) {

        assert(!err, "Error while adding a data cluster: " + err);

        assert(_.isNumber(clusterNumber), "The result must be a number value. Received: " + clusterNumber);

        console.log("New MEMORY cluster with number " + clusterNumber);

        db.removeDataCluster(clusterNumber, function(err) {

            assert(!err, "Error while removing a data cluster: " + err);

            console.log("MEMORY cluster removed");

            db.close();
        });
    });
});

