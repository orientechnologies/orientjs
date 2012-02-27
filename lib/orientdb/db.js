
function Db(databaseName, serverConfig, options) {
  this.databaseName = databaseName;
  this.serverConfig = serverConfig;  
  this.options = options == null ? {} : options;  
};

exports.Db = Db;

Db.prototype.open = function (callback) {

};
