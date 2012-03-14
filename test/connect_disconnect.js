var assert = require("assert");

var Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");

var server = new Server(serverConfig);


server.connect(function(err, sessionId) {

    assert(!err, "Error while connecting to the server: " + err);

    console.log("Connected on session: " + sessionId);

    server.disconnect(function(err) {

        assert(!err, "Error while disconnecting from the server: " + err);

        console.log("Closed connection");
    });
});

