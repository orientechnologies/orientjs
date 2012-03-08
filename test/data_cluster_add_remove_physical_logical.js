var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
//var db = new Db("test_clusters", server, dbConfig);
var db = new Db("temp", server, dbConfig);


//server.connect(function(err, sessionId) {
//
//    if (err) { console.log(err); return; }
//
//    db.create(function(err) {
//
//        if (err) { console.log(err); return; }
//
//        console.log('Created test database: ' + db.databaseName);

        db.open(function(err, result) {

            if (err) { console.log(err); return; }

            var clusterOptions = {
                type: "PHYSICAL",
                name: "test_physical",
                file_name: "a_filename"
            }

            db.addDataCluster(clusterOptions, function(err, clusterNumber) {

                if (err) { console.log(err); return; }

                if (typeof clusterNumber !== "number") {
                    throw new Error("The result must be a number value. Received: " + (typeof clusterNumber));
                }

                console.log("New PHYSICAL cluster with number " + clusterNumber);
            
                var clusterOptions = {
                    type: "LOGICAL",
                    name: "test_logical",
                    physical_cluster_container_id: clusterNumber
                }

                db.addDataCluster(clusterOptions, function(err, clusterNumber) {

                    if (err) { console.log(err); return; }

                    if (typeof clusterNumber !== "number") {
                        throw new Error("The result must be a number value. Received: " + (typeof clusterNumber));
                    }

                    console.log("New LOGICAL cluster with number " + clusterNumber);

//                    db.drop(function(err) {
//
//                        if (err) { console.log(err); return; }
//
//                        console.log("Dropped test database");

                        server.disconnect(function(err) {
                            if (err) { console.log(err); return; }
                        });
//                    });
                });
            });
        });
//    });
//});

