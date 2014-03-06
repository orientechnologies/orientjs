'use strict';

var util = require('util'),
    Db = require('./db').Db,
    parser = require('./connection/parser'),
    Promise = require('bluebird'),
    _ = require('lodash');

var VERTEX_CLASS_NAME = 'V';
var EDGE_CLASS_NAME = 'E';
var PERSISTENT_CLASS_NAME = 'ORIDs';
var FIELD_IN = 'in';
var FIELD_OUT = 'out';

var GraphDb = exports.GraphDb = function(options) {
    Db.call(this, options);
};

util.inherits(GraphDb, Db);

GraphDb.prototype.checkForGraphSchema = function () {
  var checkORIDs = function() {
    var cluster = this.getClusterByName(PERSISTENT_CLASS_NAME);
    if (cluster === null) {
      return this.classCreate('ORIDs');
    } else {
      return Promise.resolve();
    }
  };

  var checkClassWithShortName = function(fieldName, className, classShortName, inOutFieldType) {
    this[fieldName] = this.getClusterByName(className);
    if (parser.isNullOrUndefined(this[fieldName])) {
      return this.classCreate(className)
      .then(function() {
        return this.query('ALTER CLASS ' + className + ' SHORTNAME ' + classShortName, null);
      })
      .then(function(){
        return this.query('CREATE PROPERTY ' + className + '.in ' + inOutFieldType, null);
      })
      .then(function(){
        return this.query('CREATE PROPERTY ' + className + '.out ' + inOutFieldType, null);
      });
    }
    else {
      return Promise.resolve();
    }
  };

  var checkVertexClass = function() {
    return checkClassWithShortName.call(this, 'vertexClass', VERTEX_CLASS_NAME, 'V', 'LINKSET')
    .bind(this)
    .then(function(results){
      return this.query('ALTER CLASS ' + VERTEX_CLASS_NAME + ' OVERSIZE 2', null);
    });
  };

  return checkORIDs.call(this)
  .bind(this)
  .then(checkVertexClass)
  .then(function(results) {
    return checkClassWithShortName.call(this, 'edgeClass', EDGE_CLASS_NAME, 'E', 'LINK');
  })
  .then(this.reload);
}

GraphDb.prototype.open = function(database) {
  return Db.prototype.open.call(this, database)
  .bind(this)
  .then(this.checkForGraphSchema);
};

/* Vertex */
GraphDb.prototype.vertexCreate = function(vertex) {
  vertex = vertex || '';
  var clazz = vertex['@class'] || VERTEX_CLASS_NAME,
      cluster = self.getClusterByName(clazz),
      sql;

  if (parser.isNullOrUndefined(cluster)) {
    sql = 'CREATE VERTEX ' + clazz;
  }
  else {
    sql = 'CREATE VERTEX ' + clazz + ' CLUSTER ' + cluster.name;
  }

  return this.query(sql)
  .then(function(results){
    var vertex = results[0];
    vertex['@rid'] = parser.parseRid(vertex['@rid']);
    return vertex;
  });
};

GraphDb.prototype.vertexDelete = function(vertex, conditions, limit, callback) {
  limit = limit || -1;
  var isLimit = limit === -1 ? '' : 'LIMIT ' + limit;
  conditions = conditions || '';

  var rid;

  if (_.isObject(vertex)) {
    rid = parser.parseRid(vertex['@rid']);
  }
  else {
    rid = parser.parseRid(vertex);
  }

  if (!rid.recordId) {
    return Promise.reject(new Error('OrientDB: Vertex Delete: Record ID is invalid.'))
  }

  var sql = 'DELETE VERTEX ' + rid.recordId + ' ' + conditions + ' ' + isLimit;

  return this.query(sql)
  .then(function(results){
    var results = {};
    results.status = parseInt(r[0]);
    return results;
  });
};

GraphDb.prototype.from = function(vertex) {
  var rid;

  if (_.isObject(vertex)) {
    rid = parser.parseRid(vertex['@rid']);
  }
  else {
    rid = parser.parseRid(vertex);
  }

  return {
    in: function(label, callback) {
      var sql = "SELECT expand(in) FROM (SELECT expand(out_"+label+") FROM "+rid.recordId+")";
      return this.query(sql);
    }.bind(this),
    out: function(label, callback) {
      var sql = "SELECT expand(out) FROM (SELECT expand(in_"+label+") FROM "+rid.recordId+")";
      return this.query(sql);
    }.bind(this)
  };
};


/* Edges */
GraphDb.prototype.edgeCreate = function(sourceVertex, destVertex, edgeData) {
  //Source Record
  var sourceRID;

  if (_.isObject(sourceVertex)) {
    sourceRID = parser.parseRid(sourceVertex['@rid']);
  }
  else {
    sourceRID = parser.parseRid(sourceVertex);
  }

  if (!sourceRID.recordId) {
    return Promise.reject(new Error('OrientDB: Edge Create: Source Record ID is invalid.'))
  }

  //Desitination Record
  var destRID;

  if (_.isObject(destVertex)) {
    destRID = parser.parseRid(destVertex['@rid']);
  }
  else {
    destRID = parser.parseRid(destVertex);
  }

  if (!destRID.recordId) {
    return Promise.reject(new Error('OrientDB: Edge Create: Destination Record ID is invalid.'))
  }

  var clazz = edgeData['@class'] || EDGE_CLASS_NAME,
      cluster = self.getClusterByName(clazz),
      sqlsets = parser.hashToSQLSets(edgeData),
      sql;

  if (parser.isNullOrUndefined(cluster)) {
    sql = 'CREATE EDGE ' + clazz + ' FROM ' + sourceRID.recordId + " TO " + destRID.recordId;
  }
  else {
    sql = 'CREATE EDGE ' + clazz + ' CLUSTER ' + cluster.name + ' FROM ' + sourceRID.recordId + " TO " + destRID.recordId;
  }

  if (sqlsets.sqlsets !== '') {
    sql = sql + ' ' + sqlsets.sqlsets;
  }

  return this.query(sql)
  .bind(this)
  .then(function(results) {
    //Format Edge
    var edge = results[0];
    edge[FIELD_OUT] = sourceRID.recordId;
    edge[FIELD_IN] = destRID.recordId;

    if (_.isEmpty(sqlsets.remaining)) {
      return edge;
    }
    else {
      _.extend(edge, sqlsets.remaining);
      return this.save(edge)
      .then(function () {
        return edge;
      });
    }
  });
};