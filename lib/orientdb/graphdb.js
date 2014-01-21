'use strict';

var util	= require('util'),
    Db		= require('./db').Db,
    parser	= require('./connection/parser'),
    _		= require('lodash');

var VERTEX_CLASS_NAME		= 'V';
var EDGE_CLASS_NAME			= 'E';
var PERSISTENT_CLASS_NAME	= 'ORIDs';
var FIELD_IN				= 'in';
var FIELD_OUT				= 'out';

var GraphDb = exports.GraphDb = function(options) {
    Db.call(this, options);
};

util.inherits(GraphDb, Db);

function EMPTY_FUNCTION() {}

function checkForGraphSchema(self, callback) {
    var checkORIDs	= function(callback) {
        var cluster	= self.getClusterByClass(PERSISTENT_CLASS_NAME);

		if(cluster === null) {
            self.createClass('ORIDs', callback);
        } else {
            return callback();
        }
    };

    var checkClassWithShortName	= function(fieldName, className, classShortName, inOutFieldType, callback) {
        self[fieldName]	= self.getClassByName(className);

        if(parser.isNullOrUndefined(self[fieldName])) {
            self.createClass(className, function(err) {
                if(error) {
					return callback(err);
				}

                self.query('ALTER CLASS ' + className + ' SHORTNAME ' + classShortName, null, function(error) {
                    if(error) {
						return callback(error);
					}

                    self.query('CREATE PROPERTY ' + className + '.in ' + inOutFieldType, null, function(error) {
                        if(error) {
							return callback(error);
						}

                        self.query('CREATE PROPERTY ' + className + '.out ' + inOutFieldType, null, callback);
                    });
                });
            });
        } else {
            return callback();
        }
    };

    var checkVertexClass = function(callback) {
        checkClassWithShortName('vertexClass', VERTEX_CLASS_NAME, 'V', 'LINKSET', function(err) {
            if (err) { return callback(err); }

            self.query('ALTER CLASS ' + VERTEX_CLASS_NAME + ' OVERSIZE 2', null, callback);
        });
    };

    checkORIDs(function(error) {
        if(error) {
			return callback(error);
		}

        checkVertexClass(function(error) {
            if(error) {
				return callback(error);
			}

            checkClassWithShortName('edgeClass', EDGE_CLASS_NAME, 'E', 'LINK', function(error) {
                if(error) {
					return callback(error);
				}

                self.reload(callback);
            });
        });
    });
}

GraphDb.prototype.open = function(name, type, callback) {
    var self = this;

    Db.prototype.open.call(self, name, type, function(error, results) {
        if(error) {
			return callback(error);
		}

		var graphOpenCallback	= function(error) {
			if(error) {
				return callback(error);
			}

			callback(null, results);
		}

        checkForGraphSchema(self, graphOpenCallback);
    });
};

GraphDb.prototype.query = function(sql, options, callback) {
	var self = this;

	Db.prototype.command.call(self, sql, options, callback);
};


/* Vertex */
GraphDb.prototype.createVertex = function(vertex, callback) {
	var self	= this;

    var clazz	= vertex['@class'] || VERTEX_CLASS_NAME;
    var cluster	= self.getClusterByClass(clazz);
    var sqlsets	= parser.hashToSQLSets(vertex);
    var sql		= 'CREATE VERTEX ' + clazz + ' CLUSTER ' + cluster.name;
    
    if (sqlsets.sqlsets !== '') {
		sql = sql.concat(' ', sqlsets.sqlsets);
    }

    self.query(sql, null, function(error, results) {
        if(error) {
			return callback(error);
		}

        var vertex = results[0];

        if (_.isEmpty(sqlsets.remaining)) {
            callback(null, vertex);
        } else {
            _.extend(vertex, sqlsets.remaining);
            self.save(vertex, callback);
        }
    });
};

GraphDb.prototype.deleteVertex = function(vertex, conditions, limit, callback) {
	var self	= this;
	var sql;

	limit		= limit || -1;
	var isLimit	= limit === -1 ? '' : 'LIMIT ' + limit;
	conditions	= conditions || '';

	if(_.isObject(vertex)) {
		if(vertex['@rid']) {
			rid	= parser.parseRid(vertex['@rid']);
			sql	= 'DELETE VERTEX ' + rid.recordId + ' ' + conditions + ' ' + isLimit;
		} else if(vertex['@class']) {
			var clazz	= vertex['@class'] || VERTEX_CLASS_NAME;
			sql	= 'DELETE VERTEX ' + clazz + ' ' + conditions + ' ' + isLimit;
		}
	} else if(_.isString(vertex)) {
		rid	= parser.parseRid(vertex);
		sql	= 'DELETE VERTEX ' + rid.recordId + ' ' + conditions + ' ' + isLimit;
	}

	self.query(sql, null, function(error, results) {
		if(error) {
			return callback(error);
		}

		var vertex = results[0];

		if (_.isEmpty(sqlsets.remaining)) {
			callback(null, vertex);
		} else {
			_.extend(vertex, sqlsets.remaining);
			self.save(vertex, callback);
		}
	});
};

GraphDb.prototype.getInVertex = function(sourceEdge, callback) {
    this.recordLoad(sourceEdge[FIELD_IN], callback);
};

GraphDb.prototype.getOutVertex = function(sourceEdge, callback) {
    this.recordLoad(sourceEdge[FIELD_OUT], callback);
};

function fieldOfRecords(records, field) {
    var rids = [];

    for (var idx = 0, length = records.length; idx < length; idx++) {
        rids.push(records[idx][field]);
    }

    return rids;
}

GraphDb.prototype.fromVertex = function(sourceVertex) {
    var self = this;

    return {
        inVertexes: function(label, callback) {
            if (_.isFunction(label)) {
                callback = label;
                label = undefined;
            }
            self.getInEdges(sourceVertex, label, function(err, edges) {
                if (err) { return callback(err); }

                self.recordLoad(fieldOfRecords(edges, FIELD_OUT), callback);
            });
        },
        outVertexes: function(label, callback) {
            if (_.isFunction(label)) {
                callback = label;
                label = undefined;
            }
            self.getOutEdges(sourceVertex, label, function(err, edges) {
                if (err) { return callback(err); }

                self.recordLoad(fieldOfRecords(edges, FIELD_IN), callback);
            });
        }
    };
};


/* Edges */
GraphDb.prototype.createEdge = function(sourceVertexRID, destVertexRID, edgeData, callback) {
	var self	= this;

	if (_.isFunction(edgeData)) {
		callback	= edgeData;
		edgeData	= undefined;
	}

	function pushRIDInto(rid, obj, field) {
		if (_.isString(obj)) {
			return;
		}

		if (obj[field] === null || typeof obj[field] === 'undefined') {
			obj[field] = [];
		}
		obj[field].push(rid);
	}

	var sourceRID	= parser.parseRid(sourceVertexRID);
	var destRID		= parser.parseRid(destVertexRID);
	var clazz		= edgeData['@class'] || EDGE_CLASS_NAME;
	var cluster		= self.getClusterByClass(clazz);
	var sqlsets		= parser.hashToSQLSets(edgeData);
	var sql			= 'CREATE EDGE ' + clazz + ' CLUSTER ' + cluster.name + ' FROM ' + sourceRID.recordId + " TO " + destRID.recordId;

	if (sqlsets.sqlsets !== '') {
		sql	= sql.concat(' ', sqlsets.sqlsets);
	}

	self.query(sql, null, function(err, results) {
		if (err) { return callback(err); }

		var edge = results[0];

		pushRIDInto(edge['@rid'], sourceVertexRID, FIELD_OUT);
		pushRIDInto(edge['@rid'], destVertexRID, FIELD_IN);

		if (_.isEmpty(sqlsets.remaining)) {
			callback(null, edge);
		} else {
			_.extend(edge, sqlsets.remaining);
			self.save(edge, callback);
		}
	});
};

GraphDb.prototype.getOutEdges = function(vertexRID, label, callback) {
	getEdgesByDirection(this, vertexRID, FIELD_OUT, label, callback);
};

GraphDb.prototype.getInEdges = function(vertexRID, label, callback) {
	getEdgesByDirection(this, vertexRID, FIELD_IN, label, callback);
};

function getEdgesByDirection(self, vertexRID, direction, label, callback) {
	if (_.isFunction(label)) {
		callback	= label;
		label		= undefined;
	}

	callback		= callback || EMPTY_FUNCTION;
	var edgesRids	= vertex[direction];

	if (!edgesRids || edgesRids.length === 0) {
		return callback(null, []);
	}

	var edges		= [];
	var loadedEdges	= 0;
	var edgesLength	= edgesRids.length;

	self.recordLoad(edgesRids, function(error, results) {
		if(error) {
			return callback(error);
		}

		loadedEdges++;

		if (!label || label === results['@class']) {
			edges.push(results);
		}

		if (loadedEdges === edgesLength) {
			return callback(null, edges);
		}
	});
}