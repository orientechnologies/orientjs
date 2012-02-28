var Db = require('../lib/orientdb').Db,
    Connection = require('../lib/orientdb').Connection,
    Server = require('../lib/orientdb').Server;

var host = process.env['ORIENTDB_NODE_DRIVER_HOST'],
    host = host != null ? host : 'localhost';
var port = process.env['ORIENTDB_NODE_DRIVER_PORT'],
    port = port != null ? port : Connection.DEFAULT_PORT;

var server = new Server(
    {
        host: host,
        port: port,
        user_name: "root",
        user_password: "83CACE21A23DB46F93BFD58A3CE48C8D29926C6EF424D7DA9BD725AE070CCDC0",
        logOperations: true,
        logErrors: true
    });

server.connect(function(err, sessionId) {

    if (err) { console.log(err); return; }

    console.log("Connected on session: " + sessionId);
});

var db = new Db("mono", server,
    {
        database_type: "graph",
        user_name: "admin",
        user_password: "admin"
        //driver_name
        //driver_version
        //protocol_version
        //client_id
    });

db.open(function(err, result) {

    if (err) { console.log(err); return; }

    console.log("Opened database: " + db.databaseName);
    console.log("Database has " + result.clusters.length + " clusters");

    db.close(function(err) {
        
        if (err) { console.log(err); return; }
    
        console.log("Closed database: " + db.databaseName);
    });
});



//    db.collection('test', function(err, collection) {      
//      // Erase all records from the collection, if any
//      collection.remove({}, function(err, result) {
//        // Insert 3 records
//        for(var i = 0; i < 3; i++) {
//          collection.insert({'a':i});
//        }
//        
//        collection.count(function(err, count) {
//          console.log("There are " + count + " records in the test collection. Here they are:");
//
//          collection.find(function(err, cursor) {
//            cursor.each(function(err, item) {
//              if(item != null) {
//                console.dir(item);
//                console.log("created at " + new Date(item._id.generationTime) + "\n")
//              }
//              // Null signifies end of iterator
//              if(item == null) {                
//                // Destory the collection
//                collection.drop(function(err, collection) {
//                  db.close();
//                });
//              }
//            });
//          });          
//        });
//      });      
//    });
