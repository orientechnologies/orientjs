var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    var clusterOptions = {
        type: "MEMORY",
        name: "TestClass"
    };

    var previousClustersLength = db.clusters.length;

    db.addDataCluster(clusterOptions, function(err, clusterId) {

        assert(!err, "Error while adding the data cluster: " + err);

        db.reload(function(err, result) {

            assert(!err, "Error while reloading the database: " + err);

            assert.equal(previousClustersLength + 1, db.clusters.length);

            db.command("create class TestClass cluster " + db.clusters[5].id, function(err, result) {

                assert(!err, "Error while creating class: " + err);

                var firstDocData = "TestClass@nick:\"ThePresident\",subdoc:(name:\"subdoc name\",id_field:42),follows:[],followers:[],name:\"Barack\",surname:\"Obama\",location:#3:2,invitedBy:,salary_cloned:,salary:120.3f";
                var data = new Buffer(firstDocData.length);
                data.write(firstDocData);

                var recordData = {
                    clusterId: clusterId,
                    content: data,
                    type: "d",
                    dataSegmentId: db.getClusterById(clusterId).dataSegmentId
                };

                console.log("Creating record: " + firstDocData);

                db.createRecord(recordData, function(err, result) {

                    assert(!err, "Error while creating record: " + err);

                    var clusterPosition = result.position;
                    var rid = "#" + clusterId + ":" + clusterPosition;

                    console.log("Loading record " + rid);

                    db.loadRecord(rid, function(err, result) {

                        assert(!err, "Error while loading record: " + err);

                        console.log("Loaded record " + JSON.stringify(result));

                        var first_version = result["@version"];

//                        assert.equal(firstDocData, result.content.toString().trim());

                        var secondDocData = "TestClass@nick:\"TheVicePresident\",subdoc:(name:\"subdoc name\",id_field:42),follows:[],followers:[],name:\"Joe\",surname:\"Biden\",location:#3:2,invitedBy:,salary_cloned:,salary:120.3f";
                        var data = new Buffer(secondDocData.length);
                        data.write(secondDocData);

                        var updateRecordPreviousVersion = {
                            clusterId: clusterId,
                            clusterPosition: clusterPosition,
                            content: data,
                            type: "d",
                            version: first_version
                        };

                        console.log("Updating record: " + secondDocData);

                        db.updateRecord(updateRecordPreviousVersion, function(err, result) {

                            assert(!err, "Error while updating record (1st time): " + JSON.stringify(err));

                            assert.equal(result.version, updateRecordPreviousVersion.version + 1);

                            console.log("Updated record to version " + result.version);

                            var currentVersion = result.version;
                            delete updateRecordPreviousVersion.version;

                            console.log("Updating record again: " + secondDocData);

                            db.updateRecord(updateRecordPreviousVersion, function(err, result) {

                                assert(!err, "Error while updating record (2nd time): " + JSON.stringify(err));

                                console.log("Updated record to version " + result.version);

                                var deleteRecord = {
                                    clusterId: updateRecordPreviousVersion.clusterId,
                                    clusterPosition: updateRecordPreviousVersion.clusterPosition,
                                    version: currentVersion
                                };

                                var rid = "#" + deleteRecord.clusterId + ":" + deleteRecord.clusterPosition;
                                console.log("Deleting record " + rid + "...");

                                db.deleteRecord(deleteRecord, function(err, result) {

                                    assert(!err, "Error while deleting record: " + JSON.stringify(err));

                                    assert.equal(1, result.status);

                                    console.log("Deleted record.");
                                    db.command("drop class TestClass", function(err, result) {
                                        assert(result);


                                        db.removeDataCluster(clusterId, function() {
                                            db.close();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

