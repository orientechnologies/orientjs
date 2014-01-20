var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");
var _ = require("lodash");

var orientdb	= require("../lib/orientdb"),
    Db			= orientdb.Db,
    Server		= orientdb.Server;

var serverConfig	= require("../config/test/serverConfig");
var dbConfig		= require("../config/test/dbConfig");
var server			= new Server(serverConfig);

server.connect(function(err) {
    assert(!err, err);

    server.list(function(err, databases) {
        assert(!err, err);

        assert.equal(0, databases.temp.indexOf("memory:"));
        assert.equal(0, databases.tinkerpop.indexOf("local:"));

        server.disconnect();
    })
});

