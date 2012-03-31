var assert = require("assert"),

    orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server,

    serverConfig = require("../config/test/serverConfig"),
    dbConfig = require("../config/test/dbConfig"),

    server = new Server(serverConfig),
    db = new Db("demo", server, dbConfig);


db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    db.command("SELECT FROM Account", function(err, results) {
        assert(!err, "Error while executing a SELECT command: " + (err && err.map(function(err) { return err.message; }).join(", ")));

        assert.equal(results.length, 1015);

        //console.log("Received results: " + JSON.stringify(results));

        db.close();
    });
});

