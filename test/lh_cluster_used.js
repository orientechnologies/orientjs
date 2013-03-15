var assert = require("assert");
var _ = require("lodash");

var testDb = require("./test_db.js");
var server = testDb.server;
var db = testDb.db;

db.open(function(err) {

    assert(!err, "Error while opening the database: " + err);

    db.isLHClustersUsed(function(err, used) {

        if (server.manager.serverProtocolVersion < 13) {
            assert(err);
        } else {
            assert(!err, err);

            assert(!used);
        }

        db.close();
    });
});

