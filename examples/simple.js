var Db = require('../lib/orientdb').Db,
    Connection = require('../lib/orientdb').Connection,
    Server = require('../lib/orientdb').Server;

debugger;
var host = process.env['ORIENTDB_NODE_DRIVER_HOST'],
    host = host != null ? host : 'localhost';
var port = process.env['ORIENTDB_NODE_DRIVER_PORT'],
    port = port != null ? port : Connection.DEFAULT_PORT;

console.log("Connecting to " + host + ":" + port);


var db = new Db('temp', new Server(host, port, {}), { native_parser: true });

db.open(function(err, db) {

    db.dropDatabase(function(err, result) {




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
  });
});
