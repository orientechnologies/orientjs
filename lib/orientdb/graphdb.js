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
            self.classCreate('ORIDs', callback);
        } else {
            return callback();
        }
    };

    var checkClassWithShortName	= function(fieldName, className, classShortName, inOutFieldType, callback) {
        self[fieldName]	= self.getClassByName(className);

        if(parser.isNullOrUndefined(self[fieldName])) {
            self.classCreate(className, function(err) {
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
GraphDb.prototype.vertexCreate = function(vertex, callback) {
	callback	= callback || EMPTY_FUNCTION;
	var self	= this;
	vertex		= vertex || '';

    var clazz	= vertex['@class'] || VERTEX_CLASS_NAME;
    var cluster	= self.getClusterByName(clazz);
    var sql;

	if(parser.isNullOrUndefined(cluster)) {
		sql		= 'CREATE VERTEX ' + VERTEX_CLASS_NAME;
	} else {
		sql		= 'CREATE VERTEX ' + clazz + ' CLUSTER ' + cluster.name;
	}

	var sqlsets	= parser.hashToSQLSets(vertex);

    if (sqlsets.sqlsets !== '') {
		sql = sql.concat(' ', sqlsets.sqlsets);
    }

    self.query(sql, null, function(error, results) {
        if(error) {
			return callback(error);
		}

        var vertex = results[0];
		vertex['@rid']	= parser.parseRid(vertex['@rid']);

        if (_.isEmpty(sqlsets.remaining)) {
            callback(null, vertex);
        } else {
            _.extend(vertex, sqlsets.remaining);
            self.save(vertex, callback);
        }
    });
};

GraphDb.prototype.vertexDelete = function(vertex, conditions, limit, callback) {
	var self	= this;

	if (_.isFunction(conditions)) {
		callback	= conditions;
		conditions	= null;
		limit		= null;
	}

	if (_.isFunction(limit)) {
		callback	= limit;
		limit		= null;
	}

	callback	= callback || EMPTY_FUNCTION;
	limit		= limit || -1;
	var isLimit	= limit === -1 ? '' : 'LIMIT ' + limit;
	conditions	= conditions || '';

	var rid;

	if(_.isObject(vertex)) {
		rid	= parser.parseRid(vertex['@rid']);
	} else {
		rid	= parser.parseRid(vertex);
	}

	if(!rid.recordId) {
		return callback(new Error('OrientDB: Vertex Delete: Record ID is invalid.'))
	}

	var sql	= 'DELETE VERTEX ' + rid.recordId + ' ' + conditions + ' ' + isLimit;

	self.query(sql, null, function(error, r) {
		if(error) {
			return callback(error);
		}

		var results		= {};
		results.status	= parseInt(r[0]);

		callback(null, results);
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

GraphDb.prototype.fromVertex = function(vertex) {
    var self = this;
	var sql, rid;

	if(_.isObject(vertex)) {
		rid	= parser.parseRid(vertex['@rid']);
	} else {
		rid	= parser.parseRid(vertex);
	}

	if(!rid.recordId) {
		return callback(new Error('OrientDB: Vertex Traverse: Record ID is invalid.'))
	}

    return {
        in: function(label, callback) {
            if (_.isFunction(label)) {
                callback	= label;
                label		= undefined;
            }

			sql	= "SELECT expand(in) FROM (SELECT expand(out_"+label+") FROM "+rid.recordId+")";
			self.query(sql, callback);
        },
        out: function(label, callback) {
            if (_.isFunction(label)) {
                callback = label;
                label = undefined;
            }

			sql	= "SELECT expand(out) FROM (SELECT expand(in_"+label+") FROM "+rid.recordId+")";
			self.query(sql, callback);
        }
    };
};


/* Edges */
GraphDb.prototype.edgeCreate = function(sourceVertex, destVertex, edgeData, callback) {
	var self	= this;

	if (_.isFunction(edgeData)) {
		callback	= edgeData;
		edgeData	= undefined;
	}

	//Source Record
	var sourceRID;

	if(_.isObject(sourceVertex)) {
		sourceRID	= parser.parseRid(sourceVertex['@rid']);
	} else {
		sourceRID	= parser.parseRid(sourceVertex);
	}

	if(!sourceRID.recordId) {
		return callback(new Error('OrientDB: Edge Create: Source Record ID is invalid.'))
	}

	//Desitination Record
	var destRID;

	if(_.isObject(destVertex)) {
		destRID	= parser.parseRid(destVertex['@rid']);
	} else {
		destRID	= parser.parseRid(destVertex);
	}

	if(!destRID.recordId) {
		return callback(new Error('OrientDB: Edge Create: Destination Record ID is invalid.'))
	}

	var clazz		= edgeData['@class'] || EDGE_CLASS_NAME;
	var cluster		= self.getClusterByName(clazz);
	var sqlsets		= parser.hashToSQLSets(edgeData);
	var sql;

	if(parser.isNullOrUndefined(cluster)) {
		sql	= 'CREATE EDGE ' + clazz + ' FROM ' + sourceRID.recordId + " TO " + destRID.recordId;
	} else {
		sql	= 'CREATE EDGE ' + clazz + ' CLUSTER ' + cluster.name + ' FROM ' + sourceRID.recordId + " TO " + destRID.recordId;
	}

	if (sqlsets.sqlsets !== '') {
		sql	= sql.concat(' ', sqlsets.sqlsets);
	}

	self.query(sql, null, function(err, results) {
		if (err) { return callback(err); }

		//Format Edge
		var edge = results[0];
		edge[FIELD_OUT]	= sourceRID.recordId;
		edge[FIELD_IN]	= destRID.recordId;

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

function getEdgesByDirection(self, vertex, direction, label, callback) {
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