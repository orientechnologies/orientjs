var assert = require("assert");
var _ = require("lodash");

var db = require("./setup_db.js").db;

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var cluster = db.clusters[0];

    db.rangeDataClusters(cluster.id, function(err, result) {

        assert(!err, "Error while retrieving data cluster range: " + err);

        assert(result.begin === 0 && result.end > 0, "Was expecting cluster '" + cluster.name + "' to begin at 0 and end at something > 0 but found " + JSON.stringify(result));

        console.log("Found data range for cluster '" + cluster.name + "' from " + result.begin + " to " + result.end);

        db.close();
    });
});

