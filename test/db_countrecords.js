var assert = require("assert");

var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;

var serverConfig = require('../config/test/serverConfig');
var dbConfig = require('../config/test/dbConfig');

var server = new Server(serverConfig);
var db = new Db('temp', server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.countRecords(function(err, count) {

        assert(!err, "Error while counting records: " + err);

        assert(typeof count === "number", "The result must be a boolean value. Received: " + (typeof count));

        console.log("Record count: " + count);

        db.close();
    });
});

