var assert = require("assert");

var orient = require("../lib/orientdb"),
    GraphDb = orient.GraphDb,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var graphdb = new GraphDb("temp", server, dbConfig);

var edgeHash = {
    config: {
        modules: {
            mod2: "modval2"
        }
    }
};

var edgeOptions = {
    "@class": "VEdge"
};


graphdb.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    prepareDatabase(function(err, sourceRID, destRID) {
        assert(!err, err);
        // save the first version of the document
        edge(sourceRID, destRID, edgeHash, edgeOptions, function(err, edgeDoc) {
            assert(!err, err);
            
            console.log("Created edge: " + JSON.stringify(edgeDoc));

            graphdb.close();
        });
    })
});


function edge(srid, drid, hash, options, callback) {
    console.dir(hash);
    graphdb.loadRecord(srid, function(err, srecord) {
        if (err) return callback(err);
        graphdb.loadRecord(drid, function(err, drecord) {
            if (err) return callback(err);
            graphdb.createEdge(srecord, drecord, hash, options, callback);
        });
    });
}

function prepareDatabase(callback) {
    graphdb.createClass("VNode", "OGraphVertex", function(err) {
        if (err) return callback(err);

        graphdb.command("CREATE PROPERTY VNode.name STRING", function(err) {
            if (err) return callback(err);

            graphdb.command("ALTER PROPERTY VNode.name MANDATORY true", function(err) {
                if (err) return callback(err);

                graphdb.command("ALTER PROPERTY VNode.name NOTNULL true", function(err) {
                    if (err) return callback(err);

                    graphdb.createClass("VEdge", "OGraphEdge", function(err) {
                        if (err) return callback(err);

                        graphdb.command("CREATE PROPERTY VEdge.config EMBEDDEDMAP", function(err) {
                            if (err) return callback(err);

                            graphdb.command("ALTER PROPERTY VEdge.config NOTNULL true", function(err) {
                                if (err) return callback(err);

                                var doc = {
                                    "@class": "VNode",
                                    name: "source"
                                };

                                graphdb.save(doc, function(err, savedDoc) {
                                    if (err) return callback(err);

                                    var sourceRID = savedDoc["@rid"];
                                    doc = {
                                        "@class": "VNode",
                                        name: "destination"
                                    };

                                    graphdb.save(doc, function(err, savedDoc) {
                                        if (err) return callback(err);

                                        var destRID = savedDoc["@rid"];

                                        callback(null, sourceRID, destRID);
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
