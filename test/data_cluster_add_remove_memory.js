var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    if (err) { console.log(err); return; }

    var clusterOptions = {
        type: "MEMORY",
        name: "test_memory"
    }

    db.addDataCluster(clusterOptions, function(err, clusterNumber) {

        if (err) { console.log(err); return; }

        if (typeof clusterNumber !== "number") {
            throw new Error("The result must be a number value. Received: " + (typeof clusterNumber));
        }

        console.log("New MEMORY cluster with number " + clusterNumber);

        db.removeDataCluster(clusterNumber, function(err) {

            if (err) { console.log(err); return; }

            console.log("MEMORY cluster removed");

            db.close();
        });
    });
});

