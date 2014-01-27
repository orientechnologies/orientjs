'use strict';

var util	= require('util'),
    Db		= require('./db').Db,
    parser	= require('./connection/parser'),
	Promise	= require('bluebird'),
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

function checkForGraphSchema(self) {
	return new Promise(function(resolve, reject) {
		var checkORIDs	= function() {
			return new Promise(function(resolve, reject) {
				var cluster	= self.getClusterByName(PERSISTENT_CLASS_NAME);

				if(cluster === null) {
					self.classCreate('ORIDs').then(
						function(results){
							resolve();
						},
						function(error) {
							reject(error);
						}
					);
				} else {
					return resolve();
				}
			});
		};

		var checkClassWithShortName	= function(fieldName, className, classShortName, inOutFieldType) {
			return new Promise(function(resolve, reject) {
				self[fieldName]	= self.getClusterByName(className);

				if(parser.isNullOrUndefined(self[fieldName])) {
					self.classCreate(className).then(
						function(results) {
							self.query('ALTER CLASS ' + className + ' SHORTNAME ' + classShortName, null).then(
								function(results){
									self.query('CREATE PROPERTY ' + className + '.in ' + inOutFieldType, null).then(
										function(results){
											self.query('CREATE PROPERTY ' + className + '.out ' + inOutFieldType, null).then(
												function(results){
													return resolve(results);
												},
												function(error) {
													return reject(error);
												}
											);
										},
										function(error) {
											return reject(error);
										}
									);
								},
								function(error) {
									return reject(error);
								}
							);
						},
						function(error) {
							return reject(error);
						}
					);
				} else {
					return resolve();
				}
			});
		};

		var checkVertexClass = function() {
			checkClassWithShortName('vertexClass', VERTEX_CLASS_NAME, 'V', 'LINKSET').then(
				function(results){
					self.query('ALTER CLASS ' + VERTEX_CLASS_NAME + ' OVERSIZE 2', null).then(
						function(results){
							return resolve(results);
						},
						function(error) {
							return reject(error);
						}
					);
				},
				function(error) {
					return reject(error);
				}
			);
		};

		checkORIDs().then(
			function(results){
				checkVertexClass().then(
					function(results){
						checkClassWithShortName('edgeClass', EDGE_CLASS_NAME, 'E', 'LINK').then(
							function(results){
								self.reload().then(
									function(results){
										resolve(results);
									},
									function(error) {
										reject(error);
									}
								);
							},
							function(error) {
								reject(error);
							}
						);
					},
					function(error) {
						reject(error);
					}
				);
			},
			function(error) {
				reject(error);
			}
		);
	});
}

GraphDb.prototype.open = function(name, type) {
    var self	= this;

	return new Promise(function(resolve, reject) {
		Db.prototype.open.call(self, name, type).then(
			function(results) {
				checkForGraphSchema(self).then(
					function(results) {
						resolve(results);
					},
					function(error) {
						reject(error);
					}
				);
			},
			function(error) {
				reject(error);
			}
		);
	});
};

/* Vertex */
GraphDb.prototype.vertexCreate = function(vertex) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		vertex		= vertex || '';
		var clazz	= vertex['@class'] || VERTEX_CLASS_NAME;
		var cluster	= self.getClusterByName(clazz);
		var sql;

		if(parser.isNullOrUndefined(cluster)) {
			sql	= 'CREATE VERTEX ' + VERTEX_CLASS_NAME;
		} else {
			sql	= 'CREATE VERTEX ' + clazz + ' CLUSTER ' + cluster.name;
		}

		var sqlsets	= parser.hashToSQLSets(vertex);

		if (sqlsets.sqlsets !== '') {
			sql = sql.concat(' ', sqlsets.sqlsets);
		}

		self.query(sql).then(
			function(results){
				var vertex = results[0];
				vertex['@rid']	= parser.parseRid(vertex['@rid']);

				if (_.isEmpty(sqlsets.remaining)) {
					resolve(vertex);
				} else {
					_.extend(vertex, sqlsets.remaining);
					self.save(vertex).then(
						function(results){
							resolve(vertex);
						},
						function(error) {
							reject(error);
						}
					);
				}
			},
			function(error) {
				reject(error);
			}
		);
	});
};

GraphDb.prototype.vertexDelete = function(vertex, conditions, limit, callback) {
	var self	= this;

	return new Promise(function(resolve, reject) {
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
			return reject(Error('OrientDB: Vertex Delete: Record ID is invalid.'))
		}

		var sql	= 'DELETE VERTEX ' + rid.recordId + ' ' + conditions + ' ' + isLimit;

		self.query(sql).then(
			function(results){
				var results		= {};
				results.status	= parseInt(r[0]);

				resolve(results);
			},
			function(error) {
				reject(error);
			}
		);
	});
};

GraphDb.prototype.from = function(vertex) {
    var self = this;
	var sql, rid;

	if(_.isObject(vertex)) {
		rid	= parser.parseRid(vertex['@rid']);
	} else {
		rid	= parser.parseRid(vertex);
	}

	return {
        in: function(label, callback) {
			return new Promise(function(resolve, reject) {
				sql	= "SELECT expand(in) FROM (SELECT expand(out_"+label+") FROM "+rid.recordId+")";

				self.query(sql).then(
					function(results) {
						resolve(results);
					},
					function(error) {
						reject(error);
					}
				);
			});
        },
        out: function(label, callback) {
			return new Promise(function(resolve, reject) {
				sql	= "SELECT expand(out) FROM (SELECT expand(in_"+label+") FROM "+rid.recordId+")";
				self.query(sql).then(
					function(results) {
						resolve(results);
					},
					function(error) {
						reject(error);
					}
				);
			});
        }
    };
};


/* Edges */
GraphDb.prototype.edgeCreate = function(sourceVertex, destVertex, edgeData) {
	var self	= this;

	return new Promise(function(resolve, reject) {
		//Source Record
		var sourceRID;

		if(_.isObject(sourceVertex)) {
			sourceRID	= parser.parseRid(sourceVertex['@rid']);
		} else {
			sourceRID	= parser.parseRid(sourceVertex);
		}

		if(!sourceRID.recordId) {
			return reject(Error('OrientDB: Edge Create: Source Record ID is invalid.'))
		}

		//Desitination Record
		var destRID;

		if(_.isObject(destVertex)) {
			destRID	= parser.parseRid(destVertex['@rid']);
		} else {
			destRID	= parser.parseRid(destVertex);
		}

		if(!destRID.recordId) {
			return reject(Error('OrientDB: Edge Create: Destination Record ID is invalid.'))
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

		self.query(sql).then(
			function(results) {
				//Format Edge
				var edge = results[0];
				edge[FIELD_OUT]	= sourceRID.recordId;
				edge[FIELD_IN]	= destRID.recordId;

				if (_.isEmpty(sqlsets.remaining)) {
					resolve(edge);
				} else {
					_.extend(edge, sqlsets.remaining);

					self.save(edge).then(
						function(results) {
							resolve(edge);
						},
						function(error) {
							reject(error);
						}
					);
				}
			},
			function(error) {
				reject(error);
			}
		);
	});
};