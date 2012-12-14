var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");
var _ = require("underscore");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require('../config/test/serverConfig');
var dbConfig = require('../config/test/dbConfig');

var server1 = new Server(serverConfig);
var db1 = new Db('temp', server1, dbConfig);

var server2 = new Server(serverConfig);
var db2 = new Db('temp', server2, dbConfig);


db1.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    if (err) { console.log(err); return; }

    console.log('Connection 1 established');

    db2.open(function(err, result) {

        assert(!err, "Error while opening the database: " + err);

        if (err) { console.log(err); return; }

        console.log('Connection 2 established');

        db1.countRecords(function(err, count) {

            if (err) { console.log(err); return; }

            assert(_.isNumber(count), "The result must be a number value. Received: " + count);

            console.log('Record count through connection 1: ' + count);

            db2.countRecords(function(err, count) {

                if (err) { console.log(err); return; }

                assert(_.isNumber(count), "The result must be a number value. Received: " + count);

                console.log('Record count through connection 2: ' + count);

                db1.close(function(err) {

                    if (err) { console.log(err); return; }

                    console.log('Connection 1 closed');

                    db2.close(function(err) {

                        if (err) { console.log(err); return; }

                        console.log('Connection 2 closed');
                    });
                });
            });
        });
    });
});

