var assert = require("assert");

var orient = require("../lib/orientdb"),
    GraphDb = orient.GraphDb,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var graphdb = new GraphDb("temp", server, dbConfig);

graphdb.open(function(err) {

    assert(!err, "Error while opening the database: " + err);

    graphdb.createVertex({ id: 0 }, function(err, rootNode) {
        assert(!err);

        graphdb.createVertex({ name: "first node" }, function(err, childNode) {
            assert(!err);

            graphdb.createEdge(rootNode, childNode, function(err, edge) {
                assert(!err);

                assert.equal(rootNode["out"][0], edge["@rid"]);
                assert.equal(childNode["in"][0], edge["@rid"]);

                assert.equal(rootNode["@rid"], edge["out"]);
                assert.equal(childNode["@rid"], edge["in"]);

                graphdb.getOutEdges(rootNode, function(err, outEdges) {
                    assert(!err);

                    assert.equal(1, outEdges.length);

                    graphdb.getInVertex(outEdges[0], function(err, vertex) {
                        assert(!err);

                        assert.equal(childNode["@rid"], vertex["@rid"]);

                        graphdb.getInEdges(childNode, function(err, inEdges) {
                            assert(!err);

                            assert.equal(1, inEdges.length);

                            graphdb.getOutVertex(inEdges[0], function(err, vertex) {
                                assert(!err);

                                assert.equal(rootNode["@rid"], vertex["@rid"]);

                                graphdb.close();
                            });
                        });
                    });
                });

            });
        });
    });
});