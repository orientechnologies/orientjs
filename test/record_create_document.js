var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server
    assert = require("assert");

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    if (err) { console.log(err); return; }

    var first_doc_data = "TestClass@nick:\"ThePresident\",subdoc:(name:\"subdoc name\",id_field:42),follows:[],followers:[],name:\"Barack\",surname:\"Obama\",location:#3:2,invitedBy:,salary_cloned:,salary:120.3f";
    var data = new Buffer(first_doc_data.length);
    data.write(first_doc_data);
    
    var clusterId = result.clusters[0].id
    var recordData = {
      clusterId: clusterId,
      content: data,
      recordType: "d"
    }
    
    db.createRecord(recordData, function(err, result) {
        
        var firstRecord = result.position;
        
        var second_doc_data = first_doc_data.replace("followers:[]", "followers:[#" + clusterId + ":" + firstRecord + "]");
        var data = new Buffer(second_doc_data.length);
        data.write(second_doc_data);
        recordData.content = data;

        db.createRecord(recordData, function(err, result) {
            
            assert(result.position == (firstRecord + 1));

            db.close();
        });
        
    });
    
});

