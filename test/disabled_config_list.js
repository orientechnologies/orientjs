var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");
var _ = require("lodash");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);

return;

server.connect(function(err) {

    assert(!err, err);

    server.configList(function(err, config) {
        assert(!err, err);

        assert(!_.isEmpty(config));
        assert(config["log.file.level"]);
        assert(config["log.console.level"]);

        server.disconnect();
    })

});

