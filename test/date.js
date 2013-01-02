var assert = require("assert");

var orient = require("../lib/orientdb"),
    GraphDb = orient.GraphDb,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var graphdb = new GraphDb("temp", server, dbConfig);

graphdb.open(function(err) {

    assert(!err, err);

    graphdb.createClass("testSchema", "OGraphVertex", function(err) {
        assert(!err, err);

        graphdb.command("CREATE PROPERTY testSchema.label string", function(err) {
            assert(!err, err);

            graphdb.command("CREATE PROPERTY testSchema.data date", function(err) {
                assert(!err, err);

                graphdb.createVertex({ label: "This date should be 2012-12-21", data: "2012-12-21" }, { class: "testSchema" }, function(err, vertex) {
                    assert(!err, err);

                    assert.equal(2012, vertex.data.getFullYear());
                    assert.equal(11, vertex.data.getMonth());
                    assert.equal(21, vertex.data.getDate());
                    
                    graphdb.dropClass("testSchema", function(err) {
                        assert(!err, err);

                        graphdb.close();
                    });
                });
            });
        });
    });
});
