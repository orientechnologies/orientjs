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

    var cluster = db.clusters[0];

    db.rangeDataClusters(cluster.id, function(err, result) {

        assert(!err, "Error while retrieving data cluster range: " + err);

        assert(result.begin === 0 && result.end > 0, "Was expecting cluster '" + cluster.name + "' to begin at 0 and end at something > 0 but found " + JSON.stringify(result));

        console.log("Found data range for cluster '" + cluster.name + "' from " + result.begin + " to " + result.end);

        db.close();
    });
});

