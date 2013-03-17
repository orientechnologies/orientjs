var assert = require("assert");
var _ = require("lodash");

var db = require("./setup_db.js").db;

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var data = new Buffer(14);
    data.write("this is a test");

    var cluster = db.clusters[0];
    var recordData = {
        clusterId: cluster.id,
        content: data,
        type: "b",
        dataSegmentId: cluster.dataSegmentId
    };

    db.createRecord(recordData, function(err, result) {

        var firstRecord = result.position;

        db.createRecord(recordData, function(err, result) {

            assert(result.position === (firstRecord + 1));

            db.close();
        });

    });

});

