/*jshint esversion: 6 */
"use strict";


const Query = require('../../db/query');
const Promise = require('bluebird');
const utils = require('../../utils');


class SessionQuery extends Query {


  /**
   * Execute the query.
   *
   * @param   {Object} params Any additional parameters to bind to the query.
   * @promise {Mixed}         The query results.
   */
  exec(params) {
    if (params) {
      this.addParams(params);
    }
    return new Promise((resolve, reject) => {
      let results = [];
      let observable = null;
      let statement = this.buildStatement();
      let opts = this.buildOptions();
      this.db.batch(statement,opts).on('data',(record)=> {
        results.push(record);
      })
      .on('error',(err)=>{
        reject(err);
      })
      .on('end',()=>{
          resolve(this._processResults(results));
      });
    });

  }


  stream(params) {
    if (params) {
      this.addParams(params);
    }
    return this.db.query(this.buildStatement(), this.buildOptions());
  }


  // TODO Implement is idempotent from Query Builder
  isIdempotent() {
    return false;
  }

  buildStatement() {
    var statement = [],
      state = this._state,
      self = this,
      result,
      crud = false;

    if (state.commit !== undefined) {
      statement.push('BEGIN;\n');
      if (state.bcommon && state.bcommon.length) {
        statement.push(state.bcommon.map(function (item) {
          if (Array.isArray(item[1]) === true) {
            var sts = item[1].map(function (stItem) {
              //var innerStm = new Statement(self.db);
              stItem._state.paramIndex = self._state.paramIndex;
              return stItem;
            });

            return 'IF( ' + item[0] + ') {\n\t' + sts.join('\n\t') + "\n};\n";
          } else if (typeof item[1] === 'function') {
            var child = new SessionQuery(self.db);
            child._state.paramIndex = self._state.paramIndex;
            item[1](child);
            return 'LET ' + item[0] + ' = ' + child + ";\n";
          } else {
            return "LET " + item[0] + ' = ' + item[1] + ";\n";
          }
        }).join(' '));
      }

    }


    if (state.create && state.create.length) {
      statement.push('CREATE ' + state.create.join(' '));
      crud = true;
    } else if (state.traverse && state.traverse.length) {
      statement.push('TRAVERSE');
      statement.push(state.traverse.join(', '));
      crud = true;
    } else if (state.select && state.select.length) {
      statement.push('SELECT');
      statement.push(state.select.join(', '));
      crud = true;
    } else if (state.update && state.update.length) {
      statement.push('UPDATE');
      statement.push(state.update.join(', '));
      crud = true;
    } else if (state.insert) {
      statement.push('INSERT');
      crud = true;
    } else if (state.delete) {
      if (state.delete.length) {
        statement.push('DELETE ' + state.delete.join(' '));
      } else {
        statement.push('DELETE');
      }
      crud = true;
    }

    if (state.from && state.from.length) {
      statement.push('FROM');
      statement.push(state.from.map(function (item) {
        if (typeof item === 'function') {
          var child = new SessionQuery(self.db);
          child._state.paramIndex = self._state.paramIndex;
          item(child);
          return '(' + child.toString() + ')';
        } else if (item instanceof SessionQuery) {
          return '(' + item.toString() + ')';
        } else if (item instanceof Array) {
          return '[' + item.join(',') + ']';
        } else if (typeof item === 'string') {
          if (utils.requiresParens(item)) {
            return '(' + item + ')';
          } else {
            return item;
          }
        } else {
          return '' + item;
        }
      }).join(', '));
    }

    if (state.commit === undefined && state.bcommon && state.bcommon.length) {
      statement.push('LET ' + state.bcommon.map(function (item) {
          if (Array.isArray(item[1]) === true) {
            var sts = item[1].map(function (stItem) {
              //var innerStm = new Statement(self.db);
              stItem._state.paramIndex = self._state.paramIndex;
              return stItem;
            });

            return 'IF( ' + item[0] + ') {\n\t' + sts.join('\n\t') + "\n};\n";
          }
          else if (typeof item[1] === 'function') {
            var child = new SessionQuery(self.db);
            child._state.paramIndex = self._state.paramIndex;
            item[1](child);
            return item[0] + ' = (' + child + ')';
          } else if (item[1] instanceof SessionQuery) {
            return item[0] + ' = (' + item[1].toString() + ')';
          } else if (utils.requiresParens(item[1])) {
            return item[0] + ' = (' + item[1] + ')';
          } else {
            return item[0] + ' = ' + item[1];
          }
        }).join(','));
    }

    if (state.to && state.to.length) {
      statement.push('TO');
      statement.push(state.to.map(function (item) {
        if (typeof item === 'function') {
          var child = new SessionQuery(self.db);
          child._state.paramIndex = self._state.paramIndex;
          item(child);
          return '(' + child.toString() + ')';
        } else if (item instanceof SessionQuery) {
          return '(' + item.toString() + ')';
        } else if (typeof item === 'string') {
          if (utils.requiresParens(item)) {
            return '(' + item + ')';
          } else {
            return item;
          }
        } else {
          return '' + item;
        }
      }).join(', '));
    }

    if (state.into && state.into.length) {
      statement.push('INTO');
      statement.push(state.into.map(function (item) {
        if (typeof item === 'string') {
          if (utils.requiresParens(item)) {
            return '(' + item + ')';
          } else {
            return item;
          }
        } else {
          return '' + item;
        }
      }).join(', '));
    }

    if (state.set && state.set.length) {


      var values = state.set.map(function (item) {
        var interim;
        if (typeof item === 'string') {
          return item;
        } else {
          return this._objectToSet(item);
        }
      }, this).filter(function (item) {
        return item;
      }).join(', ');
      if (values.length > 0) {
        statement.push('SET');
        statement.push(values);
      }
    }

    if (state.increment && state.increment.length) {
      statement.push('INCREMENT');
      statement.push(state.increment.map(function (item) {
        return utils.escape(item[0]) + ' = ' + (+item[1]);
      }).join(', '));
    }

    if (state.add && state.add.length) {
      statement.push('ADD');
      statement.push(state.add.map(function (item) {
        var field = item[0],
          values = item[1];
        return values.map(function (value) {
          var paramName = 'param' + paramify(field) + (this._state.paramIndex++);
          this.addParam(paramName, value);
          return field + ' = :' + paramName;
        }, this).join(', ');
      }, this).join(', '));
    }

    if (state.remove && state.remove.length) {
      statement.push('REMOVE');
      statement.push(state.remove.map(function (item) {
        var field = item[0],
          values = item[1];
        return values.map(function (value) {
          var paramName = 'param' + paramify(field) + (this._state.paramIndex++);
          this.addParam(paramName, value);
          return field + ' = :' + paramName;
        }, this).join(', ');
      }, this).join(', '));
    }

    if (state.put && state.put.length) {
      statement.push('PUT');
      statement.push(state.put.map(function (item) {
        var objectToAdd = item[1];
        var keys = Object.keys(objectToAdd);
        var propertyName = item[0];
        return keys.map(function (key) {
          key = utils.escape(key);
          var paramName = 'param' + paramify(propertyName + key) + (this._state.paramIndex++);
          this.addParam(paramName, objectToAdd[key]);
          return propertyName + ' = "' + key + '", :' + paramName;
        }, this).join(', ');
      }, this).join(', '));
    }

    if (state.upsert) {
      statement.push('UPSERT');
    }

    if ((state.update || state.insert || state.delete) && state.return) {
      statement.push('RETURN');
      if (Array.isArray(state.return)) {
        statement.push('[' + state.return.join(',') + ']');
      } else if (typeof state.return === 'object') {
        statement.push(encodeReturnObject(state.return));
      } else {
        statement.push(state.return);
      }
    }

    if (state.where) {
      if (state.traverse && state.traverse.length) {
        statement.push('WHILE');
      } else {
        statement.push('WHERE');
      }
      statement.push(state.where.reduce(function (accumulator, item) {
        var op = item[0],
          condition = item[1],
          comparisonOperator = item[2];

        if (condition == null) {
          accumulator[0] = op;
          return accumulator;
        }

        if (typeof condition === 'object') {
          condition = this._objectToCondition(condition, comparisonOperator);
        }

        if (condition === false) {
          return accumulator;
        }

        if (accumulator[0] === null) {
          accumulator[0] = op;
          accumulator[1].push(condition);
        } else if (accumulator[0] === op) {
          accumulator[1].push(op.toUpperCase(), condition);
        } else if (accumulator[1].length === 0) {
          accumulator[0] = op;
          accumulator[1].push(condition);
        } else {
          accumulator[0] = op;
          accumulator[1] = ['(' + accumulator[1].join(' ') + ')', op.toUpperCase(), condition];
        }
        return accumulator;
      }.bind(this), [null, []])[1].join(' '));
    }

    if (state.group && state.group.length) {
      statement.push('GROUP BY');
      statement.push(state.group.map(function (item) {
        if (typeof item === 'string') {
          if (utils.requiresParens(item)) {
            return '(' + item + ')';
          } else {
            return item;
          }
        } else {
          return '' + item;
        }
      }).join(', '));
    }

    if (state.order && state.order.length) {
      statement.push('ORDER BY');
      statement.push(state.order.map(function (item) {
        if (typeof item === 'string') {
          if (utils.requiresParens(item)) {
            return '(' + item + ')';
          } else {
            return item;
          }
        } else if (item && typeof item === 'object') {
          var keys = Object.keys(item),
            length = keys.length,
            parts = new Array(length),
            key, i;
          for (i = 0; i < length; i++) {
            key = keys[i];
            parts.push(key, item[key]);
          }
          return parts.join(' ');
        } else {
          return '' + item;
        }
      }).join(', '));
    }

    if (state.limit) {
      statement.push('LIMIT ' + (+state.limit));
    }

    if (state.strategy && state.traverse) {
      statement.push('STRATEGY ' + state.strategy);
    }

    if (state.skip) {
      statement.push('SKIP ' + (+state.skip));
    }

    if (state.lock) {
      statement.push('LOCK ' + state.lock.join(','));
    }

    if (crud && state.commit !== undefined) {
      statement.push(";\n");
    }
    if (state.rollback) {
      statement.push('\n\t ROLLBACK;\n');
    }

    if (state.sleep) {
      statement.push('\n\t SLEEP ' + state.sleep + '; \n');
    }

    if (state.commit !== undefined) {


      statement.push('COMMIT');
      if (state.commit) {
        statement.push('RETRY ' + (+state.commit));
      } else if (state.retry) {
        statement.push('RETRY ' + (+state.retry));
      }
      statement.push(';\n');
    } else if (state.retry) {
      statement.push('RETRY ' + (+state.retry));
    }

    if (state.wait) {
      statement.push('WAIT ' + (+state.wait));
    }

    if (!(state.update || state.insert || state.delete) && state.return) {
      statement.push('RETURN');
      if (Array.isArray(state.return)) {
        statement.push('[' + state.return.join(',') + ']');
      } else if (typeof state.return === 'object') {
        statement.push(encodeReturnObject(state.return));
      } else {
        statement.push(state.return);
      }
      statement.push(';\n');
    }
    return statement.join(' ');
  }
}


module.exports = SessionQuery;


function paramify(key) {
  return key.replace(/([^A-Za-z0-9])/g, '');
}


function encodeReturnObject(obj) {
  var keys = Object.keys(obj),
    length = keys.length,
    parts = new Array(length),
    key, i;
  for (i = 0; i < length; i++) {
    key = keys[i];
    parts[i] = utils.encode(key) + ":" + obj[key];
  }
  return '{' + parts.join(',') + '}';
}