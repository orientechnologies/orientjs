var assert = require("assert");
var path = require("path");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("test_create_drop", server, dbConfig);


server.connect(function(err, sessionId) {

    assert(!err, "Error while connecting to the server: " + err);

    db.create(function(err) {

        assert(!err, err);

        console.log("Created database: " + db.databaseName);

        server.disconnect(function(err) {

            assert(!err, err);

            db.open(function(err) {

                assert(!err, err);

                var location = path.dirname(db.configuration.dataSegments[0].holeFile.path);

                db.addDataSegment("test_create_drop_new_data_segment", location, function(err, segmentNumber) {

                    assert(!err, err);

                    assert.equal(db.configuration.dataSegments[segmentNumber].dataName, "test_create_drop_new_data_segment");
                    assert.equal(db.configuration.dataSegments[segmentNumber].holeFile.path, path.join(location, "test_create_drop_new_data_segment.odh"));

                    db.close(function(err) {

                        assert(!err, err);

                        server.connect(function(err, sessionId) {

                            assert(!err, err);

                            db.drop(function(err) {

                                assert(!err, "Error while dropping the database: " + err);

                                console.log("Dropped database " + db.databaseName);

                                server.disconnect();
                            });
                        });
                    });
                });
            });
        });
    });
});
