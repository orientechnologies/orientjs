var assert = require("assert");

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

        console.log("Created database: " + db.databaseName);

        db.drop(function(err) {

            assert(!err, "Error while dropping the database: " + err);

            console.log("Dropped database " + db.databaseName);

            server.disconnect();
        });
    });
});

