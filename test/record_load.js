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

    var cluster = db.getClusterByClass("OUser");

    assert.equal(4, cluster.id);

    var rid = "#" + cluster.id + ":" + 0;

    db.loadRecord(rid, function(err, record) {

        assert(!err, "Error while loading record: " + err);

        assert(record, "Null record?");

        var newUser = {
            "@type": "d",
            "@class": "OUser",
            "name": "anotheruser",
            "password": "password",
            "status": "ACTIVE",
            "roles": ["#3:0"]
        };

        db.save(newUser, function(err, newUser) {
            assert(!err);

            var newUserRID = newUser["@rid"];

            db.delete(newUser, function(err) {
                assert(!err);

                db.loadRecord(newUserRID, function(err, record) {
                    assert(err); //expect error

                    assert(!record);

                    db.close();
                });

            });
        });

    });
});

