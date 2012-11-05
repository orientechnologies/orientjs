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

    var userCluster = db.getClusterByClass("OUser");
    var roleCluster = db.getClusterByClass("ORole");

    assert(userCluster.id > 0);
    assert(roleCluster.id > 0);

    var urid = "#" + userCluster.id + ":" + 0;
    var rrid = "#" + roleCluster.id + ":" + 0;

    db.loadRecord(urid, function(err, record) {

        assert(!err, "Error while loading record: " + err);
        assert(record, "Null record? Where is the OUser " + urid);
        console.log("User loaded: " + JSON.stringify(record));

        var newUser = {
            "@type": "d",
            "@class": "OUser",
            "name": "anotheruser",
            "password": "password",
            "status": "ACTIVE",
            "roles": [rrid]
        };

        console.log("Saving new user: " + JSON.stringify(newUser));
        db.save(newUser, function(err, newUser) {

            assert(!err, "Error while saving record " + err);
            console.log("Saved new record: " + JSON.stringify(newUser));

            var newUserRid = newUser["@rid"];

            console.log("Deleting record: " + newUserRid);
            db.delete(newUser, function(err) {

                assert(!err, "Error while deleting record " + err);
                console.log("Deleted record: " + newUserRid);

                console.log("Trying to load the deleted record: " + newUserRid);
                db.loadRecord(newUserRid, function(err, record) {

                    // expect error
                    assert(err, "I should have received an error at this point.");
                    // and an empty result
                    assert(!record);
                    console.log("Just perfect: no more trace of record " + newUserRid);

                    db.close();
                });
            });
        });
    });
});

