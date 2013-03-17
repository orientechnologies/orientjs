var assert = require("assert"),
    _ = require("lodash");

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

        assert(!err, "Error while creating db: " + err);

        var databaseName = db.databaseName;
        console.log("Created database: " + databaseName);

        server.freeze(databaseName, function(err) {

            assert(!err, err);

            console.log("Freezed database " + db.databaseName);

            server.disconnect(function(err) {

                db.open(function(err) {

                    assert(!err, err);

                    assert(_.isNull(db.getClusterByName("new_user")));
                    assert(_.isNull(db.getClassByName("new_user")));

                    var user = {
                        "@class": "new_user",
                        name: "a user name"
                    };
                    db.save(user, function(err) {

                        assert(err);

                        db.query("select from new_user", function(err, results) {
                            assert(!err, err);

                            console.log(arguments);

                            db.close(function(err) {
                                assert(!err, err);

                                server.connect(function(err) {
                                    assert(!err, err);

                                    server.release(databaseName, function(err) {
                                        assert(!err, err);

                                        server.disconnect(function(err) {
                                            assert(!err, err);

                                            db.open(function(err) {
                                                assert(!err, err);

                                                assert(!_.isNull(db.getClusterByName("new_user")));
                                                //assert(!_.isNull(db.getClassByName("new_user")));

                                                db.save(user, function(err) {
                                                    assert(!err, err);

                                                    db.query("select from new_user", function(err) {
                                                        assert(!err, err);

                                                        console.log(arguments);

                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
