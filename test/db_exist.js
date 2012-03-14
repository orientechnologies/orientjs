var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


server.connect(function(err, sessionId) {

    assert(!err, "Error while connecting to the server: " + err);

    db.exist(function(err, result) {

        assert(!err, "Error while checking if database exists: " + err);

        assert(typeof result === "boolean", "The result must be a boolean value. Received: " + (typeof result));
        
        assert(result, "The \"temp\" database should be present if you managed to open it.");

        console.log("Database \"" + db.databaseName + "\" exists");

        server.disconnect();
    });
});

