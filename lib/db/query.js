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
   * @param   {Object} params Any additional parameters to bind to the query.
   * @promise {Mixed}         The query results.
   */
  exec: function (params) {
    if (params) this.addParams(params);
    return this.db.query(this.buildStatement(), this.buildOptions())
    .bind(this)
    .then(this.processResults);
  },

  /**
   * Process the results.
   * @param  {Mixed[]} results The results to process.
   * @return {Mixed[]}         The processed results.
   */
  processResults: function (results) {
    var casts;
    if (this._state.casts && this._state.casts.length) {
      casts = this._state.casts;
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
    }
    return results;
  }
});
