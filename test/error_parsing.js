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
    
    var count = 0;
    for (var idx = 0; idx < 1000; idx++) {
        db.command("SELECT FROM OUser", function() {
            count++;
        });
        db.command("CREATE CLASS OUser", function(err, results) {
            count++
            assert(err);
            if (count === 2000) {
                db.close();
            }
        });
    }
});

