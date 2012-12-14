var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");
var _ = require("underscore");

var orient = require("../lib/orientdb"),
    GraphDb = orient.GraphDb,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var graphdb = new GraphDb("temp", server, dbConfig);

var vertex = function(idx) {
    return {
        v_additional: "value" + idx + "_of_v_additional",
        embed: {
            key: "value" + idx
        }
    }
};

var edge = function(idx) {
    return {
        e_additional: "value" + idx + "_of_e_additional",
        embed: {
            key: "value" + idx
        }
    };
};

graphdb.open(function(err) {
    assert(!err, err);

    prepareDatabase(function(err) {
        assert(!err, err);

        graphdb.createVertex(vertex(1), { "class": "VertexWithMandatoryFields" }, function(err, vertex1) {
            assert(!err, err);

            assert.equal("value1_of_v_additional", vertex1.v_additional);
            assert.equal("value1", vertex1.embed.key);

            assert(!_.isUndefined(vertex1["@rid"]));

            graphdb.createVertex(vertex(2), { "class": "VertexWithMandatoryFields" }, function(err, vertex2) {
                assert(!err, err);

                assert.equal("value2_of_v_additional", vertex2.v_additional);
                assert.equal("value2", vertex2.embed.key);
                assert(!_.isUndefined(vertex2["@rid"]));

                graphdb.createEdge(vertex1, vertex2, edge(1), { "class": "EdgeWithMandatoryFields" }, function(err, edge) {
                    assert(!err, err);

                    assert.equal("value1_of_e_additional", edge.e_additional);
                    assert.equal("value1", edge.embed.key);
                    assert(!_.isUndefined(edge["@rid"]));

                    unprepareDatabase(function(err) {
                        assert(!err, err);

                        graphdb.close()
                    });
                });
            });
        });
    })

});

function prepareDatabase(callback) {
    graphdb.createClass("VertexWithMandatoryFields", "OGraphVertex", function(err) {
        if (err) return callback(err);

        graphdb.command("ALTER CLASS VertexWithMandatoryFields SHORTNAME VWMF", function(err) {
            if (err) { return callback(err); }

            graphdb.command("ALTER CLASS VertexWithMandatoryFields OVERSIZE 2", function(err) {
                if (err) { return callback(err); }

                graphdb.createClass("EdgeWithMandatoryFields", "OGraphEdge", function(err) {
                    if (err) return callback(err);

                    graphdb.command("ALTER CLASS EdgeWithMandatoryFields SHORTNAME EWMF", function(err) {
                        if (err) { return callback(err); }

                        graphdb.command("CREATE PROPERTY EWMF.e_additional string", function(err) {
                            if (err) return callback(err);

                            graphdb.command("ALTER PROPERTY EWMF.e_additional MANDATORY true", function(err) {
                                if (err) return callback(err);

                                graphdb.command("CREATE PROPERTY VWMF.v_additional string", function(err) {
                                    if (err) return callback(err);

                                    graphdb.command("ALTER PROPERTY VWMF.v_additional MANDATORY true", function(err) {
                                        if (err) return callback(err);

                                        graphdb.reload(callback);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function unprepareDatabase(callback) {
    graphdb.dropClass("VertexWithMandatoryFields", function(err) {
        if (err) return callback(err);

        graphdb.dropClass("EdgeWithMandatoryFields", callback);
    });
}