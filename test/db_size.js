var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.size(function(err, size) {

        assert(!err, "Error while retrieving the size of the database: " + err);

        assert(typeof size === "number", "The result must be a numeric value. Received: " + (typeof size));

        console.log("Database size: " + size);

        db.close();
    });
});

