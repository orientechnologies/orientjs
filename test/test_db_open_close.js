var assert = require("assert");
var _ = require("lodash");

var db = require("./setup_db.js").db;

db.open(function(err) {

    assert(!err, "Error while opening the database: " + err);

    assert(db.server.sessionId, "There must be a session ID after a call to open a database. The current session is: " + db.server.sessionId);

    console.log("Opened database: " + db.databaseName);
    console.log("Session ID: " + db.server.sessionId);
    console.log("Database clusters: " + JSON.stringify(db.clusters));
    console.log("Database classes: " + JSON.stringify(db.classes));
    console.log("Database configuration: " + JSON.stringify(db.configuration));

    // clusters
    assert(db.clusters.length >= 5);
    assert.equal(0, db.getClusterByName("Internal").id);
    // cluster name case should not matter
    var userCluster = db.getClusterByName("OuSeR");
    assert(userCluster.id > 0);
    assert.equal("MEMORY", userCluster.type);
    assert.equal("internal", db.getClusterById(0).name);

    // classes
    assert(db.classes.length >= 3);
    assert.equal("OUser", db.getClassByName("OUser").name);
    assert.equal(null, db.getClassByName("ouser"));

    assert.equal("ouser", db.getClusterByClass("OUser").name);
    assert.equal("MEMORY", db.getClusterByClass("OUser").type);
    assert.equal(null, db.getClusterByClass("ouser"));

    // memory storage doesn't have data segments
    assert.equal(null, db.getDataSegmentById(1));

    db.close(function(err) {

        assert(!err, "Error while closing the database: " + err);

        console.log("Closed database");
    });
});

