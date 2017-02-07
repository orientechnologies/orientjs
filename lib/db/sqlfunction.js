"use strict";

var RID = require('../recordid'),
  utils = require('../utils');

function SqlFunction(db) {
  this.db = db;
  this._state = {
    params: {},
    paramIndex: 0
  };
  
}


SqlFunction.extend = utils.extend;

module.exports = exports = SqlFunction;

SqlFunction.prototype.toString = function () {
  return "";
};


SqlFunction.prototype.abs = function (field) {
  this.field = field;
 
  return this.db.rawExpression(" abs(" + this.field + ") " );

};
SqlFunction.prototype.avg = function (field) {
  this.field = field;
  
  return this.db.rawExpression(" avg(" + this.field + ") " );
};

SqlFunction.prototype.sequence = function (name) {
  this.name = name;
  this.next = function(){
    return this.db.rawExpression(" sequence('" + this.name + "').next() " );
  } ;
  this.reset = function(){
    return this.db.rawExpression(" sequence('" + this.name + "').reset() " );
  } ;
  this.current = function(){
    return this.db.rawExpression(" sequence('" + this.name + "').current() " );
  } ;
  return this;
};


SqlFunction.prototype.out = function (args) {
  this.args = Array.isArray(args) ? args : [args] ;
  
  return this.db.rawExpression(" out(" + this.args.join(' , ') + ") " );
};

SqlFunction.prototype.in = function (args) {
  this.args = Array.isArray(args) ? args : [args] ;
  
  return this.db.rawExpression(" in(" + this.args.join(' , ') + ") " );
};

SqlFunction.prototype.both = function (args) {
  this.args = Array.isArray(args) ? args : [args] ;
  
  return this.db.rawExpression(" both(" + this.args.join(' , ') + ") " );
};

SqlFunction.prototype.outE = function (args) {
  this.args = Array.isArray(args) ? args : [args] ;
  
  return this.db.rawExpression(" outE(" + this.args.join(' , ') + ") " );
};

SqlFunction.prototype.inE = function (args) {
  this.args = Array.isArray(args) ? args : [args] ;
  
  return this.db.rawExpression(" inE(" + this.args.join(' , ') + ") " );
};

SqlFunction.prototype.bothE = function (args) {
  this.args = Array.isArray(args) ? args : [args] ;
  
  return this.db.rawExpression(" bothE(" + this.args.join(' , ') + ") " );
};


SqlFunction.prototype.outV = function (args) {
  this.args = Array.isArray(args) ? args : [args] ;
  
  return this.db.rawExpression(" outV(" + this.args.join(' , ') + ") " );
};

SqlFunction.prototype.inV = function (args) {
  this.args = Array.isArray(args) ? args : [args] ;
  
  return this.db.rawExpression(" inV(" + this.args.join(' , ') + ") " );
};


SqlFunction.prototype.shortestPath = function (sourceVertex,destinationVertex,direction,edgeClassName,additionalParams) {
var args = [];
 args.push(sourceVertex,destinationVertex);
 if(direction){
   args.push(direction);
   if(edgeClassName){
     args.push(edgeClassName);
     if(additionalParams){
       args.push(additionalParams);
     }
   }
 }
  return this.db.rawExpression(" shortestPath(" + this.args.join(' , ') + ") " );
};



SqlFunction.prototype.dijkstra = function (sourceVertex,destinationVertex,weightEdgeFieldName,direction) {
var args = [];
 args.push(sourceVertex,destinationVertex,weightEdgeFieldName);
 if(direction){
   args.push(direction);
   
 }
  return this.db.rawExpression(" dijkstra(" + this.args.join(' , ') + ") " );
};

SqlFunction.prototype.astar = function (sourceVertex,destinationVertex,weightEdgeFieldName,options) {
var args = [];
 args.push(sourceVertex,destinationVertex,weightEdgeFieldName);
 if(options){
   args.push(options);
   
 }
  return this.db.rawExpression(" astar(" + this.args.join(' , ') + ") " );
};

SqlFunction.prototype.distance = function (x_field,y_field,x_value,y_value) {
var args = [];
 args.push(x_field,y_field,x_value,y_value);

  return this.db.rawExpression(" distance(" + this.args.join(' , ') + ") " );
};

SqlFunction.prototype.unionall = function (fields) {
var args = fields ||  [];

  return this.db.rawExpression(" unionall(" + this.args.join(' , ') + ") " );
};