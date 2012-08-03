var util = require("util"),
    Db = require("./db").Db,
    parser = require("./connection/parser");

var VERTEX_CLASS_NAME = "OGraphVertex";
var EDGE_CLASS_NAME = "OGraphEdge";
var PERSISTENT_CLASS_NAME = "ORIDs";
var FIELD_IN = "in";
var FIELD_OUT = "out";

var GraphDb = exports.GraphDb = function(databaseName, server, options) {
    Db.call(this, databaseName, server, options);
};

util.inherits(GraphDb, Db);

function checkForGraphSchema(self, callback) {

    var checkORIDs = function(callback) {
        var cluster = self.getClusterByClass(PERSISTENT_CLASS_NAME);
        if (cluster === null) {
            self.createClass("ORIDs", callback);
        } else {
            return callback();
        }
    };

    var checkClassWithShortName = function(fieldName, className, classShortName, callback) {
        self[fieldName] = self.getClassByName(className);
        if (self[fieldName] === null || typeof self[fieldName] === "undefined") {
            self.createClass(className, function(err) {
                if (err) { return callback(err); }

                self.command("alter class " + className + " shortname " + classShortName, callback);
            });
        } else {
            return callback();
        }
    };

    var checkVertexClass = function(callback) {
        checkClassWithShortName("vertexClass", VERTEX_CLASS_NAME, "V", function(err) {
            if (err) { return callback(err); }

            self.command("alter class " + VERTEX_CLASS_NAME + " oversize 2", callback);
        });
    };

    checkORIDs(function(err) {
        if (err) { return callback(err); }

        checkVertexClass(function(err) {
            if (err) { return callback(err); }

            checkClassWithShortName("edgeClass", EDGE_CLASS_NAME, "E", function(err) {
                if (err) { return callback(err); }

                self.reload(callback);
            });
        });
    });
}

GraphDb.prototype.open = function(callback) {
    var self = this;
    Db.prototype.open.call(self, function(err) {

        if (err) { return callback(err); }

        checkForGraphSchema(self, callback);
    });
};

function createGraphElement(self, element, hash, callback) {
    if (typeof hash === "object") {
        parser.mergeHashes(element, hash);
    }
    if (typeof hash === "function") {
        callback = hash;
    }

    if (callback === null || typeof callback === "undefined") {
        return element;
    }
    self.save(element, callback);
}

GraphDb.prototype.createVertex = function(hash, callback) {
    return createGraphElement(this, {
        "@class": VERTEX_CLASS_NAME
    }, hash, callback);
};

GraphDb.prototype.createEdge = function(sourceVertexOrRID, destVertexOrRID, hash, options, callback) {
    if (parser.typeOfVar(hash) === "function") {
        callback = hash;
        hash = undefined;
        options = {};
    } else if (parser.typeOfVar(options) === "function") {
        callback = options;
        options = {};
    }

    function ridFrom(obj) {
        if (parser.typeOfVar(obj) !== "string") {
            return obj["@rid"];
        }
        return obj;
    }

    function pushRIDInto(rid, obj, field) {
        if (parser.typeOfVar(obj) === "string") {
            return;
        }

        if (obj[field] === null || typeof obj[field] === "undefined") {
            obj[field] = [];
        }
        obj[field].push(rid);
    }

    var sourceRID = ridFrom(sourceVertexOrRID);
    var destRID = ridFrom(destVertexOrRID);

    var _class = options["class"] || EDGE_CLASS_NAME;

    var self = this;

    self.command("CREATE EDGE " + _class + " from " + sourceRID + " to " + destRID, function(err, results) {
        if (err) { return callback(err); }

        var edge = results[0];
        parser.mergeHashes(edge, hash);
        self.save(edge, function(err, savedEdge) {
            if (err) { return callback(err); }

            pushRIDInto(savedEdge["@rid"], sourceVertexOrRID, FIELD_OUT);
            pushRIDInto(savedEdge["@rid"], destVertexOrRID, FIELD_IN);

            callback(null, savedEdge);
        });
    });
};
/*
GraphDb.prototype.createEdge = function(sourceVertex, destVertex, hash, options, callback) {
    var self = this;

    function onEdgeCreated(err, edge) {
        if (err) { return callback(err); }

        if (sourceVertex[FIELD_OUT] === null || typeof sourceVertex[FIELD_OUT] === "undefined") {
            sourceVertex[FIELD_OUT] = [];
        }
        sourceVertex[FIELD_OUT].push(edge["@rid"]);
        self.save(sourceVertex, function(err, savedSourceVertex) {

            if (err) { return callback(err); }

            parser.mergeHashes(sourceVertex, savedSourceVertex);

            if (destVertex[FIELD_IN] === null || typeof destVertex[FIELD_IN] === "undefined") {
                destVertex[FIELD_IN] = [];
            }
            destVertex[FIELD_IN].push(edge["@rid"]);

            self.save(destVertex, function(err, savedDestVertex) {

                if (err) { return callback(err); }

                parser.mergeHashes(destVertex, savedDestVertex);

                return callback(null, edge);
            });

        });
    }

    if (typeof hash === "function") {
        callback = hash;
        hash = undefined;
        options = {};
    } else if (typeof options === "function") {
        callback = options;
        options = {};
    }

    // TODO verify that the edge class exists
    createGraphElement(self, {
        "@class": options["class"] || EDGE_CLASS_NAME,
        "out": sourceVertex["@rid"],
        "in": destVertex["@rid"]
    }, hash, onEdgeCreated);
};
*/

function getEdgesByDirection(self, sourceVertex, direction, label, callback) {
    if (typeof label === "function") {
        callback = label;
        label = undefined;
    }
    var edgesRids = sourceVertex[direction];
    if (!edgesRids || edgesRids.length === 0) {
        return callback(null, []);
    }

    var edges = [];
    var loadedEdges = 0;
    var edgesRidsLength = edgesRids.length;
    for (var i = 0; i < edgesRidsLength; i++) {
        self.loadRecord(edgesRids[i], function(err, edge) {
            if (err) { return callback(err); }
            loadedEdges++;
            if (!label || label === edge.label) {
                edges.push(edge);
            }

            if (loadedEdges === edgesRidsLength) {
                return callback(null, edges);
            }
        });
    }
}

GraphDb.prototype.getOutEdges = function(sourceVertex, label, callback) {
    getEdgesByDirection(this, sourceVertex, FIELD_OUT, label, callback);
};

GraphDb.prototype.getInEdges = function(sourceVertex, label, callback) {
    getEdgesByDirection(this, sourceVertex, FIELD_IN, label, callback);
};

GraphDb.prototype.getInVertex = function(sourceEdge, callback) {
    this.loadRecord(sourceEdge[FIELD_IN], callback);
};

GraphDb.prototype.getOutVertex = function(sourceEdge, callback) {
    this.loadRecord(sourceEdge[FIELD_OUT], callback);
};

function fieldOfRecords(records, field) {
    var rids = [];
    for (var i = 0; i < records.length; i++) {
        rids.push(records[i][field]);
    }
    return rids;
}

GraphDb.prototype.fromVertex = function(sourceVertex) {
    var self = this;

    return {
        inVertexes: function(label, callback) {
            if (typeof label === "function") {
                callback = label;
                label = undefined;
            }
            self.getInEdges(sourceVertex, label, function(err, edges) {
                if (err) { return callback(err); }

                self.loadRecords(fieldOfRecords(edges, FIELD_OUT), callback);
            });
        },
        outVertexes: function(label, callback) {
            if (typeof label === "function") {
                callback = label;
                label = undefined;
            }
            self.getOutEdges(sourceVertex, label, function(err, edges) {
                if (err) { return callback(err); }

                self.loadRecords(fieldOfRecords(edges, FIELD_IN), callback);
            });
        }
    };
};
