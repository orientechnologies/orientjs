var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require('../config/test/serverConfig');
var dbConfig = require('../config/test/dbConfig');

var server = new Server(serverConfig);
var db = new Db('temp', server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.countRecords(function(err, count) {

        assert(!err, "Error while counting records: " + err);

        assert(parser.isNumber(count), "The result must be a boolean value. Received: " + count);

        console.log("Record count: " + count);

        db.close();
    });
});

