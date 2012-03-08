var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    if (err) { console.log(err); return; }
    
    var cluster_params = {
        type: "MEMORY",
        name: "test_memory"
    }

    db.addDataCluster(cluster_params, function(err, cluster_number) {

        if (err) { console.log(err); return; }
        
        if (typeof cluster_number !== "number") {
            throw new Error("The result must be a number value. Received: " + (typeof cluster_number));
        }
        
        console.log("New cluster number " + cluster_number);
    
        db.close(function(err) {
            if (err) { console.log(err); return; }
        });
    });
});

