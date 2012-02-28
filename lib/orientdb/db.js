var Server = require("./connection/server").Server;
var Manager = require("./connection/manager");
var OperationTypes = require("./commands/operation_types");

function Db(databaseName, serverConfig, options) {
    this.databaseName = databaseName;
    this.serverConfig = serverConfig;
    this.options = options == null ? {} : options;

    // Internal state of the server
    this._state = "disconnected";
};

exports.Db = Db;

Db.prototype.open = function (callback) {

    var data = {
        database_name: this.databaseName,
        user_name: "admin",
        user_password: "admin"
    };
    this.serverConfig.send(OperationTypes.DB_OPEN, data, callback);
};

Db.prototype.create = function (callback) {
    callback(); 
};

Db.prototype.close = function (callback) {
   callback(); 
};

Db.prototype.exist = function (callback) {
};

Db.prototype.reload = function (callback) {
};

Db.prototype.delete = function (callback) {
};

Db.prototype.size = function (callback) {
};



//    var self = this; 
//
//    // Set the status of the server
//    self._state = 'connecting';
//
//    // Set up connections
//    if (self.serverConfig instanceof Server || self.serverConfig instanceof ReplSetServers) {
//
//        self.serverConfig.connect(self, {firstCall: true}, function(err, result) {
//
//            if (err != null) {
//                // Return error from connection
//                return callback(err, null);
//            }
//
//            // Set the status of the server
//            self._state = 'connected';
//
//            // Callback
//            return callback(null, self);
//        });
//    } else {
//        return callback(Error("Server parameter must be of type Server or ReplSetServers"), null);
//    }

