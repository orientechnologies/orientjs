var assert = require("assert");
var _ = require("lodash");

var db = require("./test_db.js").db;

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var clusterIds = [];

    for (var idx = 0, length = db.clusters.length; idx < length; idx++) {
        clusterIds.push(db.clusters[idx].id);
    }

    db.countDataClusters(clusterIds, function(err, result) {

        assert(!err, "Error while counting data clusters: " + err);

        assert(_.isNumber(result.clusterCount), "Was expecting numeric value. Received " + result.clusterCount);

        console.log("Database \"" + db.databaseName + "\" has " + result.clusterCount + " clusters");

        db.close();
    });
});

