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
 * A 'strategy' clause for traverse query
 * @param {String} args The strategy how traverse should go in deep,
 *                      either 'DEPTH_FIRST'|'BREADTH_FIRST', the first one is default
 * @return {Statement}  The statement object
 */
Statement.prototype.strategy = function (s) {
  if (typeof s === 'string' && s.toUpperCase() === 'DEPTH_FIRST' || s.toUpperCase() === 'BREADTH_FIRST') {
    this._state.strategy = s.toUpperCase();
  }
  return this;
};

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
 * An `increment` clause.
 *
 * @param  {String}     property     The property name to put the key to.
 * @param  {Object}     value        The value to increment by, defaults to 1
 * @return {Statement}               The statement object.
 */
Statement.prototype.increment = function (property, value) {
  this._state.increment = this._state.increment || [];
  this._state.increment.push([property, value || 1]);
  return this;
};


/**
 * An `add` clause for set / list properties.
 *
 * @param  {String}     property     The property name to put the key to.
 * @param  {Object}     ...values    The values to add in the set / list property.
 * @return {Statement}               The statement object.
 */
Statement.prototype.add = function (property/*, ...values*/) {
  var totalArguments = arguments.length,
      values = new Array(totalArguments - 1),
      a;
  for (a = 1; a < totalArguments; a++) {
    values[a - 1] = arguments[a];
  }
  this._state.add = this._state.add || [];
  this._state.add.push([property, values]);
  return this;
};


/**
 * A `remove` clause for map / set / list properties.
 *
 * @param  {String}     property     The property name to put the key to.
 * @param  {Object}     ...values    The keys / values to remove from the map / set / list property.
 * @return {Statement}               The statement object.
 */
Statement.prototype.remove = function (property/*, ...values*/) {
  var totalArguments = arguments.length,
      values = new Array(totalArguments - 1),
      a;
  for (a = 1; a < totalArguments; a++) {
    values[a - 1] = arguments[a];
  }
  this._state.remove = this._state.remove || [];
  this._state.remove.push([property, values]);
  return this;
};

/**
 * A `put` clause for map properties.
 *
 * @param  {String}     property    The property name to put the key to.
 * @param  {Object}     keysValues  The keys and values to add in the map property.
 * @return {Statement}              The statement object.
 */
Statement.prototype.put = function (property, keysValues) {
  this._state.put = this._state.put || [];
  this._state.put.push([property, keysValues]);
  return this;
};


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
 * Specify the while clause for the statement.
 *
 * > Note: This is actually just an alias of `WHERE`.
 *
 * @param  {String|String[]} args The while clause
 * @return {Statement}            The statement object.
 */
Statement.prototype.while = Statement.prototype.where;


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
Statement.prototype.skip = function (value) {
  this._state.skip = +value;
  return this;
};

/**
 * Set the offset to start returning results from.
 *
 * > Note: This is just an alias of `.skip()`.
 *
 * @param  {Integer} value  The offset.
 * @return {Statement}      The statement object.
 */
Statement.prototype.offset = Statement.prototype.skip;

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
 * Specify the number of times to retry a command.
 *
 * @param  {Integer} retryLimit The maximum number of times to retry, defaults to 1.
 * @return {Statement}          The statement object.
 */
Statement.prototype.retry = function (retryLimit) {
  this._state.retry = retryLimit === undefined ? 1 : retryLimit;
  return this;
};

/**
 * Specify the number of milliseconds to wait between retrying a command.
 *
 * @param  {Integer} waitLimit  The number of ms to wait.
 * @return {Statement}          The statement object.
 */
Statement.prototype.wait = function (waitLimit) {
  this._state.wait = waitLimit === undefined ? 1 : waitLimit;
  return this;
};

/**
 * Return a certain variable if there is a let clause.
 * For update, insert or delete statements it will add a RETURN clause before
 * the WHERE clause.
 *
 * @param  {String} value The name of the variable or what to return.
 * @return {Statement}   The statement object.
 */
Statement.prototype.return = function (value) {
  this._state.return = value;
  return this;
};

/**
 * Specify a lucene full text query.
 *
 * > NOTE: You must have installed the lucene query plugin in OrientDB for this to work.
 *
 * @param  {String|Object} ...property    The names of the properties to include in the query.
 * @param  {String}        luceneQuery    The lucene query, using lucene QueryParser syntax.
 * @return {Statement}                    The statement object.
 */
Statement.prototype.lucene = function (property, luceneQuery) {
  if (typeof property === 'object') {
    var keys = Object.keys(property),
        length = keys.length,
        key, i;
    for (i = 0; i < length; i++) {
      key = keys[i];
      this.lucene(key, property[key]);
    }
    return this;
  }
  var properties;
  if (arguments.length > 2) {
    var totalArguments = arguments.length;
    properties = new Array(totalArguments - 1);
    for (var a = 0; a < totalArguments - 1; a++) {
      properties[a] = arguments[a];
    }
    luceneQuery = arguments[totalArguments - 1];
  }
  else {
    properties = Array.isArray(property) ? property : [property];
  }

  return this.where(
    (properties.length === 1 ? properties[0] : '[' + properties.join(',') + ']') +
    ' LUCENE ' + JSON.stringify(luceneQuery)
  );
};

/**
 * Specify a lucene spatial query, find items near the given longitude / latitude.
 *
 * > NOTE: You must have installed the lucene query plugin in OrientDB for this to work.
 *
 * @param  {String|Object} latitudeProperty  Either the name of the longitude property,
 *                                           or a map of field names to values.
 * @param  {String|Number} longitudeProperty Either the name of the latitude property,
 *                                           or the optional `maxDistanceInKms`.
 * @param  {Number}        longitude         The longitude value to compare against.
 * @param  {Number}        latitude          The latitude value to compare against.
 * @param  {Number}        maxDistanceInKms  The maximum distance in kilometers.
 * @return {Statement}                       The statement object.
 */
Statement.prototype.near = function (latitudeProperty, longitudeProperty, longitude, latitude, maxDistanceInKms) {
  var properties = [],
      values = [];
  if (typeof latitudeProperty === 'object') {
    var keys = Object.keys(latitudeProperty),
        length = keys.length,
        key, i;
    for (i = 0; i < length; i++) {
      key = keys[i];
      properties.push(key);
      values.push(latitudeProperty[key]);
    }
    maxDistanceInKms = longitudeProperty;
  }
  else {
    properties.push(latitudeProperty, longitudeProperty);
    values.push(longitude, latitude);
  }
  if (maxDistanceInKms) {
    properties.push('$spatial');
    values.push(JSON.stringify({maxDistance: maxDistanceInKms}));
  }
  return this.where(
    '['+properties.join(',')+'] NEAR ['+values.join(',')+']'
  );
};


/**
 * Specify a lucene spatial query, find items within the given bounding box.
 *
 * > NOTE: You must have installed the lucene query plugin in OrientDB for this to work.
 *
 * @param  {String|Number} latitudeProperty  The name of the latitude property.
 * @param  {String|Object} longitudeProperty The name of the longitude property.
 * @param  {Array}         box               An array of coordinates.
 * @return {Statement}                       The statement object.
 */
Statement.prototype.within = function (latitudeProperty, longitudeProperty, box) {
  return this.where(
    '['+latitudeProperty+','+longitudeProperty+'] WITHIN '+JSON.stringify(box)
  );
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
 * Use a particular Auth Token for this statement.
 *
 * @param  {String}     token  The token to use
 * @return {Statement}         The statement object.
 */
Statement.prototype.token = function (token) {
  if (typeof token === 'string') {
    token = new Buffer(token, 'base64');
  }
  this._state.token = token || false;
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
      if (typeof item === 'function') {
        var child = new Statement(self.db);
        child._state.paramIndex = self._state.paramIndex;
        item(child);
        return '(' + child.toString() + ')';
      }
      else if (item instanceof Statement) {
        return '(' + item.toString() + ')';
      }
      else if (typeof item === 'string') {
        if (utils.requiresParens(item)) {
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

  if (state.commit === undefined && state.let && state.let.length) {
    statement.push('LET ' + state.let.map(function (item) {
      if (typeof item[1] === 'function') {
        var child = new Statement(self.db);
        child._state.paramIndex = self._state.paramIndex;
        item[1](child);
        return item[0] + ' = (' + child + ')';
      }
      else if (item[1] instanceof Statement) {
        return item[0] + ' = (' + item[1].toString() + ')';
      }
      else if (utils.requiresParens(item[1])) {
        return item[0] + ' = (' + item[1] + ')';
      }
      else {
        return item[0] + ' = ' + item[1];
      }
    }).join(','));
  }

  if (state.to && state.to.length) {
    statement.push('TO');
    statement.push(state.to.map(function (item) {
      if (typeof item === 'function') {
        var child = new Statement(self.db);
        child._state.paramIndex = self._state.paramIndex;
        item(child);
        return '(' + child.toString() + ')';
      }
      else if (item instanceof Statement) {
        return '(' + item.toString() + ')';
      }
      else if (typeof item === 'string') {
        if (utils.requiresParens(item)) {
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
        if (utils.requiresParens(item)) {
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
      statement.push('['+state.return.join(',')+']');
    }
    else if (typeof state.return === 'object') {
      statement.push(encodeReturnObject(state.return));
    }
    else {
      statement.push(state.return);
    }
  }

  if (state.where) {
    if (state.traverse && state.traverse.length) {
      statement.push('WHILE');
    }
    else {
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
        if (utils.requiresParens(item)) {
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
        if (utils.requiresParens(item)) {
          return '(' + item + ')';
        }
        else {
          return item;
        }
      }
      else if (item && typeof item === 'object') {
        var keys = Object.keys(item),
            length = keys.length,
            parts = new Array(length),
            key, i;
        for (i = 0; i < length; i++) {
          key = keys[i];
          parts.push(key, item[key]);
        }
        return parts.join(' ');
      }
      else {
        return ''+item;
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

  if (state.commit !== undefined) {
    statement.push('\nCOMMIT');
    if (state.commit) {
      statement.push('RETRY ' + (+state.commit));
    }
    else if (state.retry) {
      statement.push('RETRY ' + (+state.retry));
    }
    statement.push('\n');
  }
  else if (state.retry) {
    statement.push('RETRY ' + (+state.retry));
  }

  if (state.wait) {
      statement.push('WAIT ' + (+state.wait));
  }

  if (!(state.update || state.insert || state.delete) && state.return) {
    statement.push('RETURN');
    if (Array.isArray(state.return)) {
      statement.push('['+state.return.join(',')+']');
    }
    else if (typeof state.return === 'object') {
      statement.push(encodeReturnObject(state.return));
    }
    else {
      statement.push(state.return);
    }
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
  if (this._state.token !== undefined) {
    opts.token = this._state.token;
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
    if (obj[key] === null) {
      if (operator === '!=' || operator === '<>' || operator === 'NOT') {
        conditions.push(key + ' IS NOT NULL');
      }
      else {
        conditions.push(key + ' IS NULL');
      }
    }
    else {
      paramName = 'param' + paramify(key) + (this._state.paramIndex++);
      conditions.push(key + ' ' + operator + ' :' + paramName);
      this.addParam(paramName, obj[key]);
    }
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
    if (typeof value === 'function') {
      var child = new Statement(this.db);
      child._state.paramIndex = this._state.paramIndex;
      value(child);
      expressions.push(key + ' = (' + child.toString() + ')');
    }
    else if (value instanceof Statement) {
      expressions.push(key + ' = (' + value.toString() + ')');
    }
    else if (value instanceof RID) {
      expressions.push(key + ' = ' + value);
    }
    else if (value !== undefined) {
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


function encodeReturnObject (obj) {
  var keys = Object.keys(obj),
      length = keys.length,
      parts = new Array(length),
      key, i;
  for (i = 0; i < length; i++) {
    key = keys[i];
    parts[i] = utils.encode(key) + ":" + obj[key];
  }
  return '{'+parts.join(',')+'}';
}
