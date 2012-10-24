var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


console.log("Opening connection (1st time)");
db.open(function(err) {

    assert(!err, "Error while opening the database (1st time): " + err);

    console.log("Closing connection (1st time)");
    db.close(function(err) {

        assert(!err, "Error while closing the database (1st time): " + err);

        console.log("Opening connection (2nd time)");
        db.open(function(err) {

            assert(!err, "Error while opening the database (2st time): " + err);

            console.log("Closing connection (2nd time)");
            db.close(function(err) {

                assert(!err, "Error while closing the database (2nd time): " + err);

                console.log("Opening connection (3rd time)");
                db.open(function(err) {

                    assert(!err, "Error while opening the database (3rd time): " + err);

                    console.log("Closing connection (3rd time)");
                    db.close(function(err) {
                        assert(!err, "Error while closing the database (3rd time): " + err);
                    });
                });
            });
        });
    });
});

