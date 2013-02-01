var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);

// *************************************************************************
// Do not use this functionality!!!
// Check this issue: https://github.com/gabipetrovay/node-orientdb/issues/76
// *************************************************************************
var connectionsToOpen = 3,
    openedConnections = 0;

for (var idx = 0; idx < connectionsToOpen; idx++) {

    console.log("Opening connection " + idx);

    db.open(function(err) {

        assert(!err, "Error while opening the database: " + err);

        if (++openedConnections === connectionsToOpen) {

            for (var jdx = 0; jdx < openedConnections; jdx++) {

                console.log("Closing connection.");
                db.close();
            }
        }
    });
}

