var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db('temp', server, dbConfig);


db.open(function(err, result) {

    if (err) { console.log(err); return; }

    console.log("Opened database on session: " + result.sessionId);
    console.log("Database '" + db.databaseName + "' has " + result.clusters.length + " clusters");

    db.close(function(err) {

        if (err) { console.log(err); return; }

        console.log("Closed database");
    });
});

