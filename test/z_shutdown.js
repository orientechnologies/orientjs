var assert = require("assert");

var orient = require("../lib/orientdb"),
    Server = orient.Server;

var serverConfig = require('../config/test/serverConfig');

var server = new Server(serverConfig);


server.connect(function(err, sessionId) {

    assert(!err, "Error while connecting to the server: " + JSON.stringify(err));

    server.shutdown(function(err) {

        assert(!err, "Error while disconnecting from the server: " + err);

        console.log('Server shut down');
    });
});

