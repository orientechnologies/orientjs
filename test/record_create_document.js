var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    assert(result.clusters && result.clusters.length, "The \"" + db.databaseName + "\" database must have at least one cluster if not more");

    var clusterId = result.clusters[0].id;
    console.log("Using cluster: " + clusterId + " \"" + result.clusters[0].name + "\"");

    // insert a first record
    var firstDocData = "TestClass@nick:\"ThePresident\",subdoc:(name:\"subdoc name\",id_field:42),follows:[],followers:[],name:\"Barack\",surname:\"Obama\",location:#3:2,invitedBy:,salary_cloned:,salary:120.3f";
    var data = new Buffer(firstDocData.length);
    data.write(firstDocData);

    var recordData = {
      clusterId: clusterId,
      content: data,
      recordType: "d"
    }

    console.log("Inserting 1st record...");

    db.createRecord(recordData, function(err, result) {

        assert(!err, "Error while creating the 1st record: " + err);

        var firstRecord = result.position;
        console.log("Created 1st record on position: " + firstRecord);

        // insert a second record
        var secondDocData = firstDocData.replace("followers:[]", "followers:[#" + clusterId + ":" + firstRecord + "]");
        var data = new Buffer(secondDocData.length);
        data.write(secondDocData);

        recordData.content = data;

        console.log("Inserting 2nd record...");

        db.createRecord(recordData, function(err, result) {

            assert(!err, "Error while creating the 2nd record: " + err);

            var secondRecord = result.position;

            console.log("Created 2nd record on position: " + secondRecord);
            assert(result.position == (firstRecord + 1));

            db.close();
        });
    });
});

