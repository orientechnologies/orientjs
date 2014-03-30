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
 * Use the given record id or class name.
 *
 * @param  {String|String[]} args The record id, class name or expression.
 * @return {Statement}            The statement object.
 */
Statement.prototype.from = clause('from');

/**
 * Set the given column names to the given values.
 *
 * @param  {String|String[]} args The where clause
 * @return {Statement}            The statement object.
 */
Statement.prototype.set = clause('set');

/**
 * Specify the where clause for the statement.
 *
 * @param  {String|String[]} args The where clause
 * @return {Statement}            The statement object.
 */
Statement.prototype.where = whereClause('and');

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
 * @return {String} The SQL statement.
 */
Statement.prototype.buildStatement = function () {
  var statement = [],
      state = this._state;

  if (state.traverse && state.traverse.length) {
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
    statement.push('DELETE');
  }

  if (state.from && state.from.length) {
    statement.push('FROM');
    statement.push(state.from.map(function (item) {
      if (typeof item === 'string') {
        if (/(\s+)/.test(item))
          return '(' + item + ')';
        else
          return item;
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
        if (/(\s+)/.test(item))
          return '(' + item + ')';
        else
          return item;
      }
      else {
        return ''+item;
      }
    }).join(', '));
  }

  if (state.set && state.set.length) {
    statement.push('SET');
    statement.push(state.set.map(function (item) {
      if (typeof item === 'string') {
        if (/(\s+)/.test(item))
          return '(' + item + ')';
        else
          return item;
      }
      else {
        return ''+this._objectToSet(item);
      }
    }, this).join(', '));
  }

  if (state.where) {
    statement.push('WHERE');
    statement.push(state.where.reduce(function (accumulator, item) {
      var op = item[0],
          condition = item[1];

      if (condition == null) {
        accumulator[0] = op;
        return accumulator;
      }

      if (typeof condition === 'object') {
        condition = this._objectToCondition(condition);
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
        if (/(\s+)/.test(item))
          return '(' + item + ')';
        else
          return item;
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
        if (/(\s+)/.test(item))
          return '(' + item + ')';
        else
          return item;
      }
      else {
        return ''+item;
      }
    }).join(', '));
  }

  if (state.limit) {
    statement.push('LIMIT ' + (+state.limit))
  }
  if (state.offset) {
    statement.push('OFFSET ' + (+state.offset))
  }
  return statement.join(' ');
};

Statement.prototype._objectToCondition = function (obj) {
  var conditions = [],
      params = {},
      keys = Object.keys(obj),
      total = keys.length,
      key, i, paramName;
  for (i = 0; i < total; i++) {
    key = keys[i];
    paramName = 'param' + paramify(key) + (this._state.paramIndex++);
    conditions.push(key + ' = :' + paramName);
    this.addParam(paramName, obj[key]);
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
}

Statement.prototype._objectToSet = function (obj, root) {
  var expressions = [],
      params = {},
      keys = Object.keys(obj),
      total = keys.length,
      key, i, paramName, value;
  for (i = 0; i < total; i++) {
    key = keys[i];
    value = obj[key];
    if (root) key = root + '.' + key;
    if (value && typeof value === 'object') {
      expressions.push(this._objectToSet(value, key));
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
}

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

function whereClause (operator) {
  return function (condition, params) {

    this._state.where = this._state.where || [];
    this._state.where.push([operator, condition]);
    if (params) {
      this.addParams(params);
    }
    return this;
  }
}

