var assert = require("assert");
var _ = require("lodash");

var db = require("./setup_db.js").db;

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var cluster = db.getClusterByClass("OUser");

    db.countRecordsInCluster(cluster.name, function(err, count) {

        assert.equal(3, count);

        db.close();
    });

});