var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

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
        
        var createdRecord = {
            clusterId: clusterId,
            clusterPosition: result.position
        }
        
        db.loadRecord(createdRecord, function(err, result) {
            var first_version = result.version;
            
            assert.equal(first_doc_data.substr(10), result.content.toString().trim());
            
            var second_doc_data = "TestClass@nick:\"TheVicePresident\",subdoc:(name:\"subdoc name\",id_field:42),follows:[],followers:[],name:\"Joe\",surname:\"Biden\",location:#3:2,invitedBy:,salary_cloned:,salary:120.3f";
            var data = new Buffer(second_doc_data.length);
            data.write(second_doc_data);

            var updateRecordPreviousVersion = {
                clusterId: createdRecord.clusterId,
                clusterPosition: createdRecord.clusterPosition,
                content: data,
                recordType: "d",
                version: first_version
            }
            
            db.updateRecord(updateRecordPreviousVersion, function(err, result) {
                assert.equal(result.version, updateRecordPreviousVersion.version + 1);
                
                var current_version = result.version;
                
                db.updateRecord(updateRecordPreviousVersion, function(err, result) {
                    assert(err != null);
                    
                    var deleteRecord = {
                        clusterId: updateRecordPreviousVersion.clusterId,
                        clusterPosition: updateRecordPreviousVersion.clusterPosition,
                        version: current_version
                    }
                    
                    db.deleteRecord(deleteRecord, function(err, result) {
                        assert.equal(1, result.status);
                        
                        db.close();
                    });
                });
            });
            
        });
        
    });
    
});

