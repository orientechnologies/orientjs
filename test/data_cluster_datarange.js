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

        if (result.begin !== 0 || result.end !== 1) {
            throw new Error("Was expecting cluster \"" + cluster.name + "\" to begin at 0 and end at 1 but found " + JSON.stringify(result));
        }

        db.close();
    });
});

