var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");
var _ = require("lodash");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);

server.connect(function(err) {

    assert(!err, err);

    server.configGet("log.file.level", function(err, value) {
        assert(!err, err);

        assert(_.isString(value));
        assert(value !== "");

        server.configGet("mvrbtree.loadFactor", function(err, value) {
            assert(!err, err);

            assert(_.isString(value));
            assert(value !== "");

            server.disconnect();
        })
    })
});