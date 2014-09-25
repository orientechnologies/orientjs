"use strict";

var RID = require('../recordid'),
    utils = require('../utils');

function Statement (db) {
  this.db = db;
  this._state = {
    params: {},
    paramIndex: 0
  };
}

Statement.extend = utils.extend;

module.exports = Statement;

/**
 * Select one or more columns.
 *
 * @param  {String|String[]} args The columns or expressions to select.
 * @return {Statement}            The statement object.
 */
Statement.prototype.select = clause('select', '*');

/**
 * Traverse one or more columns.
 *
 * @param  {String|String[]} args The columns or expressions to traverse.
 * @return {Statement}            The statement object.
 */
Statement.prototype.traverse = clause('traverse', '*');


/**
 * Insert expression.
 *
 * @param  {String|String[]} args The columns or expressions to select.
 * @return {Statement}            The statement object.
 */
Statement.prototype.insert = clause('insert');

/**
 * Update expression.
 *
 * @param  {String|String[]} args The record id, class name or expression.
 * @return {Statement}            The statement object.
 */
Statement.prototype.update = clause('update');

/**
 * Delete expression.
 *
 * @param  {String|String[]} args The record id, class name or expression.
 * @return {Statement}            The statement object.
 */
Statement.prototype.delete = clause('delete');

/**
 * Use the given record id or class name.
 *
 * @param  {String|String[]} args The record id, class name or expression.
 * @return {Statement}            The statement object.
 */
Statement.prototype.into = clause('into');

/**
 * Create a class, edge or vertex.
 *
 * @param {String}     type Either `class`, `edge` or `vertex`.
 * @param {String}     name The entity name.
 * @return {Statement}      The  statement object.
 */
Statement.prototype.create = clause('create');

/**
 * Use the given record id or class name.
 *
 * @param  {String|String[]|Function} args The record id, class name or expression.
 * @return {Statement}                     The statement object.
 */
Statement.prototype.from = clause('from');

/**
 * A `to` clause, used when creating edges.
 *
 * @param  {String|Function}  arg  The target to create the edge to.
 * @return {Statement}             The statement object.
 */
Statement.prototype.to = clause('to');

/**
 * Set the given column names to the given values.
 *
 * @param  {String|String[]} args The where clause
 * @return {Statement}            The statement object.
 */
Statement.prototype.set = clause('set');

/**
 * Upsert the records to avoid multiple queries.
 *
 * @param  {String|Object} condition          The condition clause, if any.
 * @param  {Object}        params             The parameters to bind to the statement, if any.
 * @param  {String}        comparisonOperator The operator to use for comparison, defaults to '='.
 * @return {Statement}                        The statement object.
 */
Statement.prototype.upsert = function (condition, params, comparisonOperator) {
  this._state.upsert = true;
  if (condition) {
    this._state.where = this._state.where || [];
    this._state.where.push(['and', condition, comparisonOperator || '=']);
    if (params) {
      this.addParams(params);
    }
  }
  return this;
};

/**
 * Specify the where clause for the statement.
 *
 * @param  {String|String[]} args The where clause
 * @return {Statement}            The statement object.
 */
Statement.prototype.where = whereClause('and');

/**
 * Specifiy a where clause, using the `CONTAINSTEXT` comparison operator.
 *
 * @param  {Object}  condition    The map of field names to values.
 * @return {Statement}            The statement object.
 */
Statement.prototype.containsText = whereClause('and', 'CONTAINSTEXT');

/**
 * Specify an `AND` condition.
 *
 * @param  {String|String[]} args The condition.
 * @return {Statement}            The statement object.
 */
Statement.prototype.and = whereClause('and');

/**
 * Specify an `OR` condition.
 *
 * @param  {String|String[]} args The condition.
 * @return {Statement}            The statement object.
 */
Statement.prototype.or = whereClause('or');

/**
 * Group by one or more columns.
 *
 * @param  {String|String[]} args The columns or expressions to group by.
 * @return {Statement}            The statement object.
 */
Statement.prototype.group = clause('group');

/**
 * Order by one or more columns.
 *
 * @param  {String|String[]} args The columns or expressions to order by.
 * @return {Statement}            The statement object.
 */
Statement.prototype.order = clause('order');

/**
 * Set the offset to start returning results from.
 *
 * @param  {Integer} value  The offset.
 * @return {Statement}      The statement object.
 */
Statement.prototype.offset = function (value) {
  this._state.offset = +value;
  return this;
};

/**
 * Set the maximum number of results to return.
 *
 * @param  {Integer} value  The limit.
 * @return {Statement}      The statement object.
 */
Statement.prototype.limit = function (value) {
  this._state.limit = +value;
  return this;
};

/**
 * Specify the fetch plan for the statement.
 *
 * @param  {String|Object} args   The fetch plan clause.
 * @return {Statement}            The statement object.
 */
Statement.prototype.fetch = clause('fetchPlan');


/**
 * Assign a value to a variable within an SQL statement.
 *
 * > Note: The value will **not** be encoded as it may contain arbitrary SQL expressions.
 * > use `Oriento.utils.encode()` if you need to allow safe values here.
 *
 * @param  {String}           name  The name of the variable to assign
 * @param  {String|Statement} value The value of the variable, can be an SQL statement.
 * @return {Statement}              The statement object.
 */
Statement.prototype.let = function (name, value) {
  this._state['let'] = this._state['let'] || [];
  this._state['let'].push([name, value]);
  return this;
};

/**
 * Specifiy a lock clause for the statement.
 *
 * @param  {String|Object} args   The lock clause.
 * @return {Statement}            The statement object.
 */
Statement.prototype.lock = clause('lock');

/**
 * Commit a transaction.
 *
 * @param  {Integer} retryLimit The maximum number of times to retry, defaults to 0.
 * @return {Statement}          The statement object.
 */
Statement.prototype.commit = function (retryLimit) {
  this._state.commit = retryLimit || 0;
  return this;
};

/**
 * Return a certain variable.
 *
 * @param  {String} name The name of the variable to return.
 * @return {Statement}   The statement object.
 */
Statement.prototype.return = function (name) {
  this._state.return = name;
  return this;
};

/**
 * Add the given parameter to the query.
 *
 * @param  {String} key    The parameter key.
 * @param  {Object} params The parameter value.
 * @return {Statement}     The statement object.
 */
Statement.prototype.addParam = function (key, value) {
  this._state.params[key] = value;
  return this;
};

/**
 * Add the given parameters to the query.
 *
 * @param  {Object} params The parameters to add.
 * @return {Statement}     The statement object.
 */
Statement.prototype.addParams = function (params) {
  var keys = Object.keys(params),
      total = keys.length,
      key, i;
  for (i = 0; i < total; i++) {
    key = keys[i];
    this._state.params[key] = params[key];
  }
  return this;
};


/**
 * Build the statement.
 * @return {String}             The SQL statement.
 */
Statement.prototype.buildStatement = function () {
  var statement = [],
      state = this._state,
      self = this,
      result;

  if (state.commit !== undefined) {
    statement.push('BEGIN\n');
  }

  if (state.let && state.let.length) {
    statement.push(state.let.map(function (item) {
      if (typeof item[1] === 'function') {
        var child = new Statement(self.db);
        child._state.paramIndex = self._state.paramIndex;
        item[1](child);
        return 'LET ' + item[0] + ' = ' + child + "\n";
      }
      else {
        return "LET " + item[0] + ' = ' + item[1] + "\n";
      }
    }).join(' '));
  }

  if (state.create && state.create.length) {
    statement.push('CREATE ' + state.create.join(' '));
  }
  else if (state.traverse && state.traverse.length) {
    statement.push('TRAVERSE');
    statement.push(state.traverse.join(', '));
  }
  else if (state.select && state.select.length) {
    statement.push('SELECT');
    statement.push(state.select.join(', '));
  }
  else if (state.update && state.update.length) {
    statement.push('UPDATE');
    statement.push(state.update.join(', '));
  }
  else if (state.insert) {
    statement.push('INSERT');
  }
  else if (state.delete) {
    if (state.delete.length) {
      statement.push('DELETE ' + state.delete.join(' '));
    }
    else {
      statement.push('DELETE');
    }
  }

  if (state.from && state.from.length) {
    statement.push('FROM');
    statement.push(state.from.map(function (item) {
      if (typeof item === 'string') {
        return item;
      }
      else {
        return ''+item;
      }
    }).join(', '));
  }

  if (state.to && state.to.length) {
    statement.push('TO');
    statement.push(state.to.map(function (item) {
      if (typeof item === 'string') {
        if (/(\s+)/.test(item)) {
          return '(' + item + ')';
        }
        else {
          return item;
        }
      }
      else {
        return ''+item;
      }
    }).join(', '));
  }

  if (state.into && state.into.length) {
    statement.push('INTO');
    statement.push(state.into.map(function (item) {
      if (typeof item === 'string') {
        if (/(\s+)/.test(item)) {
          return '(' + item + ')';
        }
        else {
          return item;
        }
      }
      else {
        return ''+item;
      }
    }).join(', '));
  }

  if (state.set && state.set.length) {
    statement.push('SET');
    statement.push(state.set.map(function (item) {
      var interim;
      if (typeof item === 'string') {
        return item;
      }
      else {
        return this._objectToSet(item);
      }
    }, this).filter(function (item) { return item; }).join(', '));
  }

  if (state.upsert) {
    statement.push('UPSERT');
  }

  if (state.where) {
    statement.push('WHERE');
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
      }
      else if (accumulator[0] === op) {
        accumulator[1].push(op.toUpperCase(), condition);
      }
      else if (accumulator[1].length === 0) {
        accumulator[0] = op;
        accumulator[1].push(condition);
      }
      else {
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
        if (/(\s+)/.test(item)) {
          return '(' + item + ')';
        }
        else {
          return item;
        }
      }
      else {
        return ''+item;
      }
    }).join(', '));
  }

  if (state.order && state.order.length) {
    statement.push('ORDER BY');
    statement.push(state.order.map(function (item) {
      if (typeof item === 'string') {
        if (/(\s+)/.test(item)) {
          return '(' + item + ')';
        }
        else {
          return item;
        }
      }
      else {
        return ''+item;
      }
    }).join(', '));
  }

  if (state.limit) {
    statement.push('LIMIT ' + (+state.limit));
  }
  if (state.offset) {
    statement.push('OFFSET ' + (+state.offset));
  }

  if (state.lock) {
    statement.push('LOCK ' + state.lock.join(','));
  }

  if (state.commit !== undefined) {
    statement.push('\nCOMMIT');
    if (state.commit) {
      statement.push('RETRY ' + (+state.commit));
    }
    statement.push('\n');
  }

  if (state.return) {
    statement.push('RETURN ' + state.return);
  }
  return statement.join(' ');
};


/**
 * Return a string version of the statement, with parameters prepared and bound.
 *
 * @return {String} The prepared statement.
 */
Statement.prototype.toString = function () {
  return utils.prepare(this.buildStatement(), this._state.params);
};


/**
 * Build the options for the statement.
 * @return {Object} The SQL statement options.
 */
Statement.prototype.buildOptions = function () {
  var opts = {};
  if (this._state.params) {
    opts.params = this._state.params;
  }
  if (this._state.fetchPlan) {
    opts.fetchPlan = this._state.fetchPlan.reduce(function (list, item) {
      var keys, total, key, i;
      if (item) {
        if (typeof item === 'string') {
          list.push(item);
        }
        else if (typeof item === 'object') {
          keys = Object.keys(item);
          total = keys.length;
          for (i = 0; i < total; i++) {
            key = keys[i];
            list.push(key + ':' + item[key]);
          }
        }
      }
      return list;
    }, []).join(' ');
  }
  if (this._state.commit !== undefined) {
    opts.class = 's';
  }
  return opts;
};

Statement.prototype._objectToCondition = function (obj, operator) {
  var conditions = [],
      params = {},
      keys = Object.keys(obj),
      total = keys.length,
      key, i, paramName;
  operator = operator || '=';
  for (i = 0; i < total; i++) {
    key = keys[i];
    paramName = 'param' + paramify(key) + (this._state.paramIndex++);
    conditions.push(key + ' ' + operator + ' :' + paramName);
    this.addParam(paramName, obj[key] instanceof RID ? ''+obj[key] : obj[key]);
  }

  if (conditions.length === 0) {
    return false;
  }
  else if (conditions.length === 1) {
    return conditions[0];
  }
  else {
    return '(' + conditions.join(' AND ') + ')';
  }
};

Statement.prototype._objectToSet = function (obj) {
  var expressions = [],
      params = {},
      keys = Object.keys(obj),
      total = keys.length,
      key, i, paramName, value;
  for (i = 0; i < total; i++) {
    key = keys[i];
    value = obj[key];
    if (value instanceof RID) {
      expressions.push(key + ' = ' + value);
    }
    else {
      paramName = 'param' + paramify(key) + (this._state.paramIndex++);
      expressions.push(key + ' = :' + paramName);
      this.addParam(paramName, value);
    }
  }

  if (expressions.length === 0) {
    return false;
  }
  else {
    return expressions.join(', ');
  }
};

function paramify (key) {
  return key.replace(/([^A-Za-z0-9])/g, '');
}

function clause (name) {
  var defaults = Array.prototype.slice.call(arguments, 1);
  return function (args) {
    if (args === undefined) {
      args = defaults;
    }
    else if (!Array.isArray(args)) {
      args = Array.prototype.slice.call(arguments);
    }
    this._state[name] = this._state[name] || [];
    this._state[name].push.apply(this._state[name], args);
    return this;
  };
}

function whereClause (operator, comparisonOperator) {
  comparisonOperator = comparisonOperator || '=';
  return function (condition, params) {
    this._state.where = this._state.where || [];
    this._state.where.push([operator, condition, comparisonOperator]);
    if (params) {
      this.addParams(params);
    }
    return this;
  };
}

