var assert = require("assert");
var _ = require("lodash");
var parser = require("../lib/orientdb/connection/parser");

var db = require("./setup_db.js").db;

db.open(function(err) {

    assert(!err, err);

    var userCluster = db.getClusterByName("ouser");

    db.query("select from OUser", function(err, users) {
        assert(!err, err);

        assert(users.length >= 1);

        var user = users[0];
        var rid = parser.parseRid(user["@rid"]);

        db.positionsHigher(users[0]["@rid"], function(err, positions) {

            assert(!err, err);

            assert(_.isArray(positions));
            var position = positions[0];

            assert.equal(position.clusterPosition, rid.clusterPosition + 1);
            assert.equal(position.dataSegmentId, userCluster.dataSegmentId);
            assert.equal(position.dataSegmentPos, userCluster.id);
            assert.equal(position.recordSize, 0);
            assert.equal(position.recordVersion, 0);

            db.close();
        });

    });
});

