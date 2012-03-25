var assert = require("assert");

var Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");

var server = new Server(serverConfig);


server.connect(function(err) {

    assert(!err, "Error while connecting to the server: " + JSON.stringify(err));

    assert(server.sessionId > -1, "The session ID is not valid.");

    console.log("Connected on session: " + server.sessionId);

    server.disconnect(function(err) {

        assert(!err, "Error while disconnecting from the server: " + err);

        console.log("Closed connection");
    });
});

