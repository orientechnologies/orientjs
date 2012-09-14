var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");

var orient = require("../lib/orientdb"),
    GraphDb = orient.GraphDb,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var graphdb = new GraphDb("temp", server, dbConfig);

graphdb.open(function(err) {
    assert(!err, err);

    prepareDatabase(function(err) {
        assert(!err, err);

        graphdb.createVertex({v_additional: "value_of_v_additional"}, function(err, vertex1) {
            assert(!err, err);

            assert.equal("value_of_v_additional", vertex1.v_additional);
            assert(!parser.isUndefined(vertex1["@rid"]));

            graphdb.createVertex({v_additional: "value2_of_v_additional"}, function(err, vertex2) {
                assert(!err, err);

                assert(!parser.isUndefined(vertex2["@rid"]));

                graphdb.createEdge(vertex1, vertex2, { e_additional: "value_of_e_additional" }, function(err, edge) {
                    assert(!err, err);

                    assert.equal("value_of_e_additional", edge.e_additional);
                    assert(!parser.isUndefined(edge["@rid"]));

                    graphdb.close()
                });
            });
        });
    })

});

function prepareDatabase(callback) {
    graphdb.command("CREATE PROPERTY E.e_additional string", function(err) {
        if (err) return callback(err);

        graphdb.command("ALTER PROPERTY E.e_additional MANDATORY true", function(err) {
            if (err) return callback(err);

            graphdb.command("CREATE PROPERTY V.v_additional string", function(err) {
                if (err) return callback(err);

                graphdb.command("ALTER PROPERTY V.v_additional MANDATORY true", function(err) {
                    if (err) return callback(err);

                    callback();
                });
            });
        });
    });
}
