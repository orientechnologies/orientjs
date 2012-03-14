var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var data = new Buffer(14);
    data.write("this is a test");
    
    var clusterId = result.clusters[0].id
    var recordData = {
      clusterId: clusterId,
      content: data,
      recordType: "b"
    }
    
    db.createRecord(recordData, function(err, result) {
        
        var firstRecord = result.position;

        db.createRecord(recordData, function(err, result) {
            
            assert(result.position == (firstRecord + 1));

            db.close();
        });
        
    });
    
});

