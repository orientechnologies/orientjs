var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err) {

    assert(!err, "Error while opening the database: " + err);

    assert(db.server.sessionId, "There must be a session ID after a call to open a database. The current session is: " + db.server.sessionId);

    console.log("Opened database: " + db.databaseName);
    console.log("Session ID: " + db.server.sessionId);
    console.log("Database clusters: " + JSON.stringify(db.clusters));
    console.log("Database classes: " + JSON.stringify(db.classes));
    console.log("Database configuration: " + JSON.stringify(db.configuration));

    assert(db.clusters.length >= 5);
    assert(db.classes.length >= 2);
    assert.equal(0, db.getClusterIdByName("Internal"));
    // cluster name case should not matter
    assert.equal(4, db.getClusterIdByName("OuSeR"));

    db.close(function(err) {

        assert(!err, "Error while closing the database: " + err);

        console.log("Closed database");
    });
});


