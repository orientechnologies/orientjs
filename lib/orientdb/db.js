var Server = require("./connection/server").Server,
    Manager = require("./connection/manager"),
    OperationTypes = require("./commands/operation_types"),
    parser = require("./connection/parser");


var Db = exports.Db = function (databaseName, server, options) {

    if (typeof databaseName !== "string") {
        throw new Error("Database name was not provided.");
    }

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
    this.clusters = [];
};


Db.prototype.getClusterIdByName = function(clusterName) {

    var lowerCaseClusterName = clusterName.toLowerCase();

    for (var i in this.clusters) {
        if (this.clusters[i].name === lowerCaseClusterName) {
            return this.clusters[i].id;
        }
    }

    return -1;
}


Db.prototype.getClusterIdByClass = function(className) {

    for (var i in this.classes) {
        if (this.classes[i].name === className) {
            return this.classes[i].defaultClusterId;
        }
    }

    return -1;
}


Db.prototype.open = function (callback) {
    var self = this;

    // for the open operation we want to do some DB and server initialization
    var openCallback = function(err, result) {

        if (err) { return callback(err); }

        // save the session ID in the server and the clusters in the DB
        // TODO the clusters also have to be updated with the cluster commands
        self.server.sessionId = result.sessionId;
        self.clusters = result.clusters;

        // retreive the DB schema and save it
        // TODO the schema also needs to be update if this changes
        //      (I am not sure if this is currently supported in the protocol)
    
        self.loadRecord("#0:0", function(err, result) {
            
            if (err) { return callback(err); }

            self.configuration = parser.parseConfiguration(result.data.toString());

            self.loadRecord(self.configuration.schemaRecordId, function(err, result) {
                
                if (err) { return callback(err); }
    
                self.schema = result.schema;
                self.classes = result.classes;
    
                // only now call the open callback
                callback();
            });
        });
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
    var self = this;

    var reloadCallback = function(err, result) {

        if (err) { return callback(err); }

        self.clusters = result.clusters;

        var classesCallback = function(err, result) {
            self.schema = result.schema;
            self.classes = result.classes;
            callback(err, result);
        }

        self.loadRecord("#0:1", classesCallback);
    };

    this.server.send(OperationTypes.DB_RELOAD, reloadCallback);
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


Db.prototype.rangeDataClusters = function (clusterId, callback) {

    var data = {
        clusterId: clusterId
    };

    this.server.send(OperationTypes.DATACLUSTER_DATARANGE, data, callback);
};


Db.prototype.createRecord = function (recordData, callback) {

    var recordType = null;

    switch (recordData.type) {

        case "b":
            recordType = 98;
            break;

        case "d":
            recordType = 100;
            break;

        case "f":
            recordType = 102;
            break;
    }

    if (!recordType) {
        return callback("Invalid record type. Valid values are: b, d, and f");
    }

    var data = {
        clusterId: recordData.clusterId,
        content: recordData.content,
        type: recordType,
        mode: 0
    };

    this.server.send(OperationTypes.RECORD_CREATE, data, callback);
};


Db.prototype.loadRecord = function (rid, options, callback) {

    if (typeof options === "function") {
        callback = options;
        options = {};
    }

    var clusterId = null,
        clusterPos = null;

    if (typeof rid !== "string" || rid.substr(0, 1) !== "#" || rid.substr(1).split(":").length != 2) {
        return callback("The RID must be a string having the format: #<cluster id>:<cluster position>");
    }
    // TODO allow also rid as object literal (probably merged with options)

    var splits = rid.substr(1).split(":");
    var clusterId = parseInt(splits[0]),
        clusterPos = parseInt(splits[1]);

    var data = {
        cluster_id: clusterId,
        cluster_position: clusterPos,
        fetch_plan: (typeof options.fetchPlan === "string") ? options.fetchPlan : ""
    };

    // TODO this goes with rc9
    //data.ignore_cache = (typeof options.ignoreCache === "number") ? options.ignoreCache : "";

    this.server.send(OperationTypes.RECORD_LOAD, data, function(err, result) {

        if (err) { return callback(err); }

        if (!result) { return callback("A null or undefined record was returned."); }

        var record;

        switch (result.type) {

            case "b":
                record = {
                    "@rid": rid,
                    "@type": "b",
                    "@version": result.version,
                    data: result.content
                };
                
                break;

            case "d":
                record = parser.deserializeDocument(result.content.toString());
                record["@rid"] = rid;
                record["@type"] = "d";
                record["@version"] = result.version;

                break;

            case "f":
                // TODO not implemented
                callback("The record type f is currently not supported by the orientdb driver.");

                break;

            default:
                return callback("Invalid or not supported record type: " + result.type);
        }

        callback(null, record);
    });
};


Db.prototype.updateRecord = function (recordData, callback) {

    var recordType = null;

    switch (recordData.type) {

        case "b":
            recordType = 98;
            break;

        case "d":
            recordType = 100;
            break;

        case "f":
            recordType = 102;
            break;
    }

    if (!recordType) {
        return callback("Invalid record type. Valid values are: b, d, and f");
    }

    var data = {
        clusterId: recordData.clusterId,
        clusterPosition: recordData.clusterPosition,
        content: recordData.content,
        type: recordType,
        mode: 0
    };

    if (typeof recordData.version === "number") {
        data.version = recordData.version;
    } else {
        data.version = -1;
    }

    this.server.send(OperationTypes.RECORD_UPDATE, data, callback);
};


Db.prototype.deleteRecord = function (recordData, callback) {

    var data = {
        clusterId: recordData.clusterId,
        clusterPosition: recordData.clusterPosition,
        version: recordData.version,
        mode: 0
    };

    this.server.send(OperationTypes.RECORD_DELETE, data, callback);
};


Db.prototype.save = function(document, callback) {

    if (typeof document["@class"] === "undefined") {
        return callback("Document must have a class");
    }

    var self = this;

    var recordData = {};
    recordData.type = "d";

    if (typeof document["@rid"] !== "undefined") {
        var rid = document["@rid"];
        recordData.clusterId = parseInt(rid.substr(0, rid.indexOf(":")));
        recordData.clusterPosition = parseFloat(rid.substr(rid.indexOf(":") + 1))
    }

    if (typeof document["@version"] !== "undefined") {
        recordData.version = document["@version"];
    }

    delete document["@version"];
    delete document["@rid"];

    recordData.content = parser.stringToBytes(parser.serializeDocument(document));

    var saveDocument = function(recordData) {

        if (typeof recordData.clusterPosition !== "undefined") {
            self.updateRecord(recordData, function(err, result) {
                self.loadRecord("#" + recordData.clusterId + ":" + recordData.clusterPosition, callback);
            });
        } else {
            self.createRecord(recordData, function(err, result) {
                self.loadRecord("#" + recordData.clusterId + ":" + result.position, callback);
            });
        }
    };

    var clusterId = this.getClusterIdByClass(document["@class"]);

    if (clusterId !== -1) {
        recordData.clusterId = clusterId;
        saveDocument(recordData);
    } else {
        var clusterOptions = {
            type: this.clusters[this.getClusterIdByName("default")].type,
            name: document["@class"]
        }

        self.addDataCluster(clusterOptions, function(err, clusterId) {
            self.command("create class " + document["@class"] + " cluster " + clusterId, function(err, result) {
                self.reload(function(err, result) {
                    recordData.clusterId = clusterId;
                    saveDocument(recordData);
                });
            });
        });

    }
};

