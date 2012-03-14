var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var clusterIds = [];

    for (index in result.clusters) {
        clusterIds.push(result.clusters[index].id);
    }

    db.countDataClusters(clusterIds, function(err, result) {

        assert(!err, "Error while counting data clusters: " + err);

        assert(typeof result.clusterCount === "number", "Was expecting numeric value. Received " + (typeof result.clusterCount));

        console.log("Database \"" + db.databaseName + "\" has " + result.clusterCount + " clusters");

        db.close();
    });
});

