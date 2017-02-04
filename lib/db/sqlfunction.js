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
