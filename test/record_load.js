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

    var cluster = db.getClusterByClass("OUser");

    assert.equal(4, cluster.id);

    var rid = "#" + cluster.id + ":" + 0;

    db.loadRecord(rid, function(err, record) {

        assert(!err, "Error while loading record: " + err);

        assert(record, "Null record?");

        console.log(record);

        db.close();
    });
});

