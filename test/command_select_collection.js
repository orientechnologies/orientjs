var assert = require("assert");

var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;

var serverConfig = require('../config/test/serverConfig');
var dbConfig = require('../config/test/dbConfig');

var server = new Server(serverConfig);
var db = new Db('temp', server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.command('SELECT FROM OUser', function(err, result) {
 
        assert(!err, "Error while executing a SELECT command: " + err);
 
        console.log('Received results: ' + JSON.stringify(result));

        db.close();
    });
});

