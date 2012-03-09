var Server = require("./connection/server").Server,
    Manager = require("./connection/manager"),
    OperationTypes = require("./commands/operation_types");


var Db = exports.Db = function (databaseName, server, options) {

    this.databaseName = databaseName;

    if (server instanceof Server) {
        this.server = server;
    } else {
        // TODO
        throw new Error("Not implemented: server configuration as object literal not yet supported");
    }

    this.options = options || {};
    this.userName = options.user_name;
    this.userPassword = options.user_password;
    this.databaseType = options.database_type || "document";
    this.storageType = options.storage_type || "local";
};


Db.prototype.open = function (callback) {
    var self = this;

    // for the open operation we want to save the session ID in the server instance
    var openCallback = function(err, result) {

        if (err) { return callback(err); }
        
        self.server.sessionId = result.sessionId;
        callback(err, result);
    };

    var data = {
        database_name: self.databaseName,
        user_name: self.userName,
        user_password: self.userPassword
    };

    self.server.init(function (err) {
        self.server.send(OperationTypes.DB_OPEN, data, openCallback);
    });
};


Db.prototype.create = function (callback) {

    var data = {
        database_name: this.databaseName,
        database_type: this.databaseType,
        storage_type: this.storageType
    };

    this.server.send(OperationTypes.DB_CREATE, data, callback);
};


Db.prototype.close = function (callback) {
    this.server.send(OperationTypes.DB_CLOSE, callback);
};


Db.prototype.exist = function (callback) {

    var data = {
        database_name: this.databaseName
    };

    this.server.send(OperationTypes.DB_EXIST, data, function(err, result) {

        if (err) { return callback(err); }

        result = result || {};
        callback(null, result.result);
    });

};


Db.prototype.reload = function (callback) {
    this.server.send(OperationTypes.DB_RELOAD, callback);
};


Db.prototype.drop = function (callback) {

    var data = {
        database_name: this.databaseName
    };

    this.server.send(OperationTypes.DB_DELETE, data, function(err, result) {

        if (err) { return callback(err); }

        // TODO something's fishy in the protocol because
        //      the server does not return the 'result' byte
        // TODO also the server does not complain if the database does not exist
        result = result || {};
        callback(null, result.result || 1);
    });
};


Db.prototype.size = function (callback) {

    this.server.send(OperationTypes.DB_SIZE, function(err, result) {

        if (err) { return callback(err); }

        result = result || {};
        callback(null, result.size);
    });
};


Db.prototype.countRecords = function (callback) {

    this.server.send(OperationTypes.DB_COUNTRECORDS, function(err, result) {

        if (err) { return callback(err); }

        result = result || {};
        callback(null, result.count);
    });
};


Db.prototype.command = function (command, callback) {

    var data = {
        query_text: command,
        mode: "s",
    };

    this.server.send(OperationTypes.COMMAND, data, function(err, result) {

        if (err) { return callback(err); }

        callback(null, result.content);
    });
};


Db.prototype.addDataCluster = function (clusterOptions, callback) {

    var data = {};

    switch (clusterOptions.type) {
    case "PHYSICAL":
    case "LOGICAL":
    case "MEMORY":
        data.type = clusterOptions.type;
        break;
    default:
        data.type = "MEMORY"
    }

    data.name = clusterOptions.name;

    if (data.type === "PHYSICAL") {

        data.file_name = clusterOptions.file_name || "";

        if (typeof clusterOptions.initial_size === "number" && clusterOptions.initial_size >= 0) {
            data.initial_size = clusterOptions.initial_size;
        } else {
            data.initial_size = -1;
        }

    } else if (data.type === "LOGICAL") {

        // TODO where is this in the spec?
        data.physical_cluster_container_id = clusterOptions.physical_cluster_container_id;
    }

    this.server.send(OperationTypes.DATACLUSTER_ADD, data, function(err, result) {

        if (err) { return callback(err); }

        callback(null, result.number);
    });
};


Db.prototype.removeDataCluster = function (clusterNumber, callback) {

    var data = {
        cluster_number: clusterNumber
    };
    
    this.server.send(OperationTypes.DATACLUSTER_REMOVE, data, callback);
};


Db.prototype.countDataClusters = function (clustersId, callback) {

    var data = {
        clustersId: clustersId
    };
    
    this.server.send(OperationTypes.DATACLUSTER_COUNT, data, callback);
};

