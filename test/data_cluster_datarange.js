var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var cluster = result.clusters[0];

    db.rangeDataClusters(cluster.id, function(err, result) {

        assert(!err, "Error while retrieving data cluster range: " + err);

        if (result.begin != 0 || result.end != 2) {
            throw new Error("Was expecting cluster \"" + cluster.name + "\" to begin at 0 and end at 2 but found " + JSON.stringify(result));
        }

        db.close();
    });
});

