var assert = require("assert");
var _ = require("lodash");
var parser = require("../lib/orientdb/connection/parser");

var db = require("./setup_db.js").db;
var server = db.server;

db.open(function(err) {

    assert(!err, err);

    var userCluster = db.getClusterByName("ouser");

    db.query("select from OUser", function(err, users) {
        assert(!err, err);

        assert(users.length >= 1);

        var firstUser = users[0];
        var firstUserRID = parser.parseRid(firstUser["@rid"]);

        db.positionsHigher(firstUser["@rid"], function(err, positions) {
            if (server.manager.serverProtocolVersion < 13) {
                assert(err);

                db.close();
            } else {

                assert(!err, err);

                assert(_.isArray(positions));
                var position = positions[0];

                assert.equal(position.clusterPosition, firstUserRID.clusterPosition + 1);
                assert.equal(position.dataSegmentId, userCluster.dataSegmentId);
                assert.equal(position.dataSegmentPos, 5);
                assert.equal(position.recordSize, 0);
                assert.equal(position.recordVersion, 0);

                var secondUser = users[1];
                var secondUserRID = parser.parseRid(secondUser["@rid"]);

                db.positionsLower(secondUser["@rid"], function(err, positions) {

                    assert(!err, err);

                    assert(_.isArray(positions));
                    var position = positions[0];

                    assert.equal(position.clusterPosition, secondUserRID.clusterPosition - 1);
                    assert.equal(position.dataSegmentId, userCluster.dataSegmentId);
                    assert.equal(position.dataSegmentPos, 3);
                    assert.equal(position.recordSize, 0);
                    assert.equal(position.recordVersion, 0);

                    db.close();
                });
            }
        });

    });
});

