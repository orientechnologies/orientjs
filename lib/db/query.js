var Statement = require('./statement');

module.exports = exports = Statement.extend({
  /**
   * Typecast the returned results.
   * Accepts either a single function, which will be passed
   * the entire record / row as first argument, OR, an object
   * where each key on the object will be used to type cast properties of
   * the same name in the result set.
   *
   * @param  {Function|Object} caster The casting function or map of functions.
   * @return {Query}                  The query object.
   */
  cast: function (caster) {
    this._state.casts = this._state.casts || [];
    this._state.casts.push(caster);
    return this;
  },

  /**
   * Return only the given column(s) from the result set.
   *
   * > Note: This does **not** impose a select clause!
   *
   * @param  {String} name,...  The column name(s).
   * @return {Query}            The query instance.
   */
  column: function () {
    this._state.columns = (this._state.columns || []).concat(Array.prototype.slice.call(arguments));
    return this;
  },

  /**
   * Execute the query and promise the first result.
   * This is useful when e.g. loading a single record.
   *
   * > Note: This does **not** impose a limit clause!
   *
   * @param   {Object} params Any additional parameters to bind to the query.
   * @promise {Mixed}         The first query result.
   */
  one: function (params) {
    return this.exec(params)
    .then(function (results) {
      return results[0];
    });
  },

  /**
   * Execute the query and promise all the results.
   *
   * @param   {Object} params Any additional parameters to bind to the query.
   * @promise {Mixed[]}         The query results.
   */
  all: function (params) {
    return this.exec(params);
  },

  /**
   * Execute the query and promise to return the value
   * of the first row/column in the results.
   * This is useful for e.g. `COUNT()` expressions.
   *
   * @param   {Object} params Any additional parameters to bind to the query.
   * @promise {Mixed[]}         The query results.
   */
  scalar: function (params) {
    return this.exec(params)
    .then(function (response) {
      var key;
      response = response[0];
      if (response && typeof response === 'object') {
        key = Object.keys(response).filter(function (item) {
          return item[0] !== '@';
        })[0];
        if (key) {
          return response[key];
        }
      }
      return response;
    });
  },

  /**
   * Execute the query.
   *
   * @param   {Object} params Any additional parameters to bind to the query.
   * @promise {Mixed}         The query results.
   */
  exec: function (params) {
    if (params) this.addParams(params);
    return this.db.query(this.buildStatement(), this.buildOptions())
    .bind(this)
    .then(this._processResults);
  },

  /**
   * Process the results.
   *
   * @param  {Mixed[]} results The results to process.
   * @return {Mixed[]}         The processed results.
   */
  _processResults: function (results) {
    if (this._state.columns && this._state.columns.length) {
      results = this._processColumns(results);
    }
    if (this._state.casts && this._state.casts.length) {
      results = this._processCasts(results);
    }
    return results;
  },

  /**
   * Process any scheduled casts against the given results.
   *
   * @param  {Mixed[]} results The results to process.
   * @return {Mixed[]}         The processed results.
   */
  _processCasts: function (results) {
    var casts = this._state.casts;
    return results.map(function (result) {
      return casts.reduce(function (result, caster) {
        if (typeof caster === 'function') {
          return caster(result);
        }
        var keys = Object.keys(caster),
            total = keys.length,
            key, i;
        for (i = 0; i < total; i++) {
          key = keys[i];
          if (result[key]) {
            result[key] = caster[key](result[key]);
          }
        }
        return result;
      }, result);
    });
  },

  /**
   * Process any scheduled column filters against the given results.
   *
   * @param  {Mixed[]} results The results to process.
   * @return {Mixed[]}         The processed results.
   */
  _processColumns: function (results) {
    var columns = this._collateColumns(),
        names = Object.keys(columns),
        total = names.length;
    return results.map(function (result) {
      if (total === 1) {
        return result ? result[names[0]] : undefined;
      }
      var obj = {},
          i, name;
      for (i = 0; i < total; i++) {
        name = names[i];
        obj[columns[name]] = result[name];
      }
      return obj;
    });
  },

  /**
   * Map the selected column names to any aliases.
   *
   * @return {Object} The column names.
   */
  _collateColumns: function () {
    return this._state.columns.reduce(function (columns, column) {
      if (!column) {
        return columns;
      }
      else if (typeof column === 'string') {
        columns[column] = column;
        return columns;
      }
      var keys = Object.keys(column),
          total = keys.length,
          key, i;

      for (i = 0; i < total; i++) {
        key = keys[i];
        columns[key] = column[key];
      }

      return columns;
    }, {});
  }
});
