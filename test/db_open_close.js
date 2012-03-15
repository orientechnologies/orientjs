var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    assert(!err, "There must be a session ID after a call to open a database. Received: " + result.sessionId);

    console.log("Opened database: " + db.databaseName);
    console.log("Session ID:" + result.sessionId);
    console.log("Database clusters: " + JSON.stringify(db.clusters));
    console.log("Database classes: " + JSON.stringify(db.classes));
    
    assert.equal(5, db.clusters.length);
    assert.equal(2, db.classes.length);
    assert.equal(0, db.getClusterIdByName("Internal"));
    assert.equal(4, db.getClusterIdByName("OUSER"));

    db.close(function(err) {

        assert(!err, "Error while closing the database: " + err);

        console.log("Closed database");
    });
});

