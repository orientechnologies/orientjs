var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");
var _ = require("lodash");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


server.connect(function(err, sessionId) {

    assert(!err, "Error while connecting to the server: " + err);

    db.exist(function(err, result) {

        assert(!err, "Error while checking if database exists: " + err);

        assert(_.isBoolean(result), "The result must be a boolean value. Received: " + result);
        
        assert(result, "The \"temp\" database should be present if you managed to open it.");

        console.log("Database \"" + db.databaseName + "\" exists");

        server.disconnect();
    });
});

