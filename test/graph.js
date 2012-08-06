var assert = require("assert");

var orient = require("../lib/orientdb"),
    GraphDb = orient.GraphDb,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var graphdb = new GraphDb("temp", server, dbConfig);

function createVertexes(graphdb, callback) {
    graphdb.createVertex({ id: 0 }, function(err, rootNode) {
        assert(!err);

        graphdb.createVertex({ name: "first node" }, function(err, childNode) {
            assert(!err);

            graphdb.createEdge(rootNode, childNode, function(err, edge) {
                assert(!err, err);

                assert.equal(rootNode["out"][0], edge["@rid"]);
                assert.equal(childNode["in"][0], edge["@rid"]);

                assert.equal(rootNode["@rid"], edge["out"]);
                assert.equal(childNode["@rid"], edge["in"]);

                graphdb.createEdge(childNode, rootNode, { label: "child_of" }, function(err, edge) {
                    assert(!err, err);
                    graphdb.createEdge(childNode, rootNode, function(err, edge) {
                        assert(!err, err);
                        callback(rootNode, childNode);
                    });
                });

            });
        });
    });
}

graphdb.open(function(err) {

    assert(!err, "Error while opening the database: " + err);

    assert.equal("OGraphVertex", graphdb.getClassByName("OGraphVertex").name);
    assert.equal("OGraphVertex", graphdb.getClassByName("V").name);
    assert.equal("OGraphEdge", graphdb.getClassByName("OGraphEdge").name);
    assert.equal("OGraphEdge", graphdb.getClassByName("E").name);

    createVertexes(graphdb, function(rootNode, childNode) {
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

                        graphdb.getOutEdges(childNode, function(err, outEdges) {
                            assert(!err);

                            assert.equal(2, outEdges.length);

                            graphdb.getOutEdges(childNode, "child_of", function(err, outEdges) {
                                assert(!err);
                                assert.equal(1, outEdges.length);

                                graphdb.fromVertex(childNode).outVertexes("child_of", function(err, vertexes) {
                                    assert(!err);

                                    assert.equal(1, vertexes.length);

                                    assert.equal(rootNode["@rid"], vertexes[0]["@rid"]);

                                    graphdb.fromVertex(childNode).outVertexes(function(err, vertexes) {
                                        assert(!err);

                                        assert.equal(2, vertexes.length);

                                        graphdb.fromVertex(childNode).inVertexes(function(err, vertexes) {
                                            assert(!err);

                                            assert.equal(1, vertexes.length);
                                            assert.equal(rootNode["@rid"], vertexes[0]["@rid"]);

                                            graphdb.close();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});