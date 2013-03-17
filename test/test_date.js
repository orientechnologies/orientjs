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

            graphdb.command("CREATE PROPERTY testSchema.a_date date", function(err) {
                assert(!err, err);

                graphdb.command("CREATE PROPERTY testSchema.a_datetime datetime", function(err) {
                    assert(!err, err);

                    graphdb.createVertex({ label: "This date should be 2012-12-21", a_date: "2012-12-21", a_datetime: 1296279468123 }, { class: "testSchema" }, function(err, vertex) {
                        assert(!err, err);

                        assert.equal(2012, vertex.a_date.getFullYear());
                        assert.equal(11, vertex.a_date.getMonth());
                        assert.equal(21, vertex.a_date.getDate());
                        
                        assert.equal(0, vertex.a_date.getMilliseconds());
                        assert.equal(123, vertex.a_datetime.getMilliseconds());

                        graphdb.dropClass("testSchema", function(err) {
                            assert(!err, err);

                            graphdb.close();
                        });
                    });
                });
            });
        });
    });
});
