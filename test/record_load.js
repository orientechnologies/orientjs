var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var clusterId = db.getClusterIdByClass("OUser");

    assert.equal(4, clusterId);

    var rid = "#" + clusterId + ":" + 0;

    db.loadRecord(rid, function(err, record) {

        assert(!err, "Error while loading record: " + err);

        assert(record, "Null record?");

        console.log(record);

        db.close();
    });
});

