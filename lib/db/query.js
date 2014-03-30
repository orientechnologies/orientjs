var Statement = require('./statement');

module.exports = exports = Statement.extend({
  one: function (params) {
    if (params) this.addParams(params);
    return this.exec()
    .then(function (results) {
      return results[0];
    });
  },
  all: function (params) {
    if (params) this.addParams(params);
    return this.exec();
  },
  scalar: function (params) {
    if (params) this.addParams(params);
    return this.exec()
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
  exec: function (params) {
    if (params) this.addParams(params);
    return this.db.query(this.buildStatement(), {
      params: this._state.params
    });
  }
});
