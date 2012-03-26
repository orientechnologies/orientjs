var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


var connectionsToOpen = 10,
    openedConnections = 0;

for (var i = 0; i < connectionsToOpen; i++) {

    console.log("Opening connection " + i);

    db.open(function(err) {

        assert(!err, "Error while opening the database: " + err);

        if (++openedConnections == connectionsToOpen) {

            for (var j = 0; j < openedConnections; j++) {

                console.log("Closing connection.");
                db.close();
            }
        }
    });
}

