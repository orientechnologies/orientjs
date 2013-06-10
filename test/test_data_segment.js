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
                var segmentCount = db.configuration.dataSegments.length;

                db.addDataSegment("test_create_drop_new_data_segment", location, function(err, segmentNumber) {

                    assert(!err, err);

                    assert.equal(db.configuration.dataSegments[segmentNumber].dataName, "test_create_drop_new_data_segment");
                    assert.equal(db.configuration.dataSegments[segmentNumber].holeFile.path, path.join(location, "test_create_drop_new_data_segment.odh"));

                    db.dropDataSegment("test_create_drop_new_data_segment", function(err, successful) {

                        assert(!err, err);

                        assert(successful);
                        // starting with Orient 1.4.0 there is an additional "index" segment with ID 1
                        assert.equal(db.configuration.dataSegments.length, segmentCount);
                        assert.equal(db.configuration.dataSegments[0].dataId, 0);
                        assert.equal(db.configuration.dataSegments[0].dataName, "default");

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
});
