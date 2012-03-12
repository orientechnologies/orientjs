var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    if (err) { console.log(err); return; }

    var clusterIds = [];
    for (index in result.clusters) {
        clusterIds.push(result.clusters[index].id);
    }

    db.countDataClusters(clusterIds, function(err, result) {

        if (result.clustersCount != 10) {
            throw new Error("Was expecting 10 clusters but found " + result.clustersCount);
        }

        db.close();   
    });
});

