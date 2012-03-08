var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp_physical", server, dbConfig);

server.connect(function(err, sessionId) {

    if (err) { console.log(err); return; }

    db.create(function(err) {
        
        if (err) { console.log(err); return; }
    
        console.log('Created database: ' + db.databaseName);

        db.open(function(err, result) {
        
            if (err) { console.log(err); return; }
            
            var cluster_params = {
              type: "PHYSICAL",
              name: "test_physical",
              file_name: "a_filename"
            }
        
            db.dataClusterAdd(cluster_params, function(err, cluster_number) {
                if (err) { console.log(err); return; }
                
                if (typeof cluster_number !== "number") {
                    throw new Error("The result must be a number value. Received: " + (typeof cluster_number));
                }
                
                console.log("New cluster number " + cluster_number);
            
                cluster_params = {
                  type: "LOGICAL",
                  name: "test_logical",
                  physical_cluster_container_id: cluster_number
                }
                
                db.dataClusterAdd(cluster_params, function(err, cluster_number) {
                    if (err) { console.log(err); return; }
                    
                    if (typeof cluster_number !== "number") {
                        throw new Error("The result must be a number value. Received: " + (typeof cluster_number));
                    }
                    
                    console.log("New cluster number " + cluster_number);
                    db.drop(function(err) {
                        if (err) { console.log(err); return; }
            
                        console.log('Deleted database');

                        server.disconnect(function(err) {
                
                            if (err) { console.log(err); return; }
                        });
                    });
                });
            });
        });
    });
});

