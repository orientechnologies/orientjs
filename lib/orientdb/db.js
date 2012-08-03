var Server = require("./connection/server").Server,
    OperationTypes = require("./commands/operation_types"),
    parser = require("./connection/parser");

function EMPTY_FUNCTION() {
}

var Db = exports.Db = function(databaseName, server, options) {

    if (parser.typeOfVar(databaseName) !== parser.TYPE_STRING) {
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


Db.prototype.getClusterByName = function(clusterName) {

    var lowerCaseClusterName = clusterName.toLowerCase();

    for (var i in this.clusters) {
        if (this.clusters[i].name === lowerCaseClusterName) {
            return this.clusters[i];
        }
    }

    return null;
};

Db.prototype.getClusterById = function(clusterId) {

    for (var i in this.clusters) {
        if (this.clusters[i].id === clusterId) {
            return this.clusters[i];
        }
    }

    return null;
};

Db.prototype.getDataSegmentById = function(dataSegmentId) {

    for (var i in this.configuration.dataSegments) {
        if (this.configuration.dataSegments[i].dataId === dataSegmentId) {
            return this.configuration.dataSegments[i];
        }
    }

    return null;
};


Db.prototype.getClusterByClass = function(className) {

    var clazz = this.getClassByName(className);
    if (clazz) {
        for (var i in this.clusters) {
            if (this.clusters[i].id === clazz.defaultClusterId) {
                return this.clusters[i];
            }
        }
        throw new Error("Default clusterId " + clazz.defaultClusterId + " for class " + className + " is not present");
    }

    return null;
};


Db.prototype.getClassByName = function(className) {

    for (var i in this.classes) {
        if (this.classes[i].name === className || this.classes[i].shortName === className) {
            return this.classes[i];
        }
    }

    return null;
};


function loadDbSchema(db, callback) {
    callback = callback || EMPTY_FUNCTION;

    db.loadRecord("#0:0", function(err, result) {

        if (err) { return callback(err); }

        db.configuration = parser.parseConfiguration(result.data.toString());

        db.loadRecord(db.configuration.schemaRecordId, function(err, result) {

            if (err) { return callback(err); }

            db.schema = result.schema;
            db.classes = result.classes;

            // only now call the open callback
            callback();
        });
    });
}


Db.prototype.open = function(callback) {
    var self = this;
    callback = callback || EMPTY_FUNCTION;

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
        loadDbSchema(self, callback);
    };

    var data = {
        database_name: self.databaseName,
        user_name: self.userName,
        user_password: self.userPassword,
        database_type: self.databaseType
    };

    self.server.init(function(err) {

        if (err) { return callback(err); }

        self.server.send(OperationTypes.DB_OPEN, data, openCallback);
    });
};


Db.prototype.create = function(callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
        database_name: this.databaseName,
        database_type: this.databaseType,
        storage_type: this.storageType
    };

    this.server.send(OperationTypes.DB_CREATE, data, callback);
};


Db.prototype.close = function(callback) {
    callback = callback || EMPTY_FUNCTION;

    this.server.send(OperationTypes.DB_CLOSE, callback);
};


Db.prototype.exist = function(callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
        database_name: this.databaseName
    };

    this.server.send(OperationTypes.DB_EXIST, data, function(err, result) {

        if (err) { return callback(err); }

        result = result || {};
        callback(null, result.result);
    });

};


Db.prototype.reload = function(callback) {
    var self = this;
    callback = callback || EMPTY_FUNCTION;

    var reloadCallback = function(err, result) {

        if (err) { return callback(err); }

        self.clusters = result.clusters;

        loadDbSchema(self, callback);
    };

    this.server.send(OperationTypes.DB_RELOAD, reloadCallback);
};


Db.prototype.drop = function(callback) {
    callback = callback || EMPTY_FUNCTION;

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


Db.prototype.size = function(callback) {
    callback = callback || EMPTY_FUNCTION;

    this.server.send(OperationTypes.DB_SIZE, function(err, result) {

        if (err) { return callback(err); }

        result = result || {};
        callback(null, result.size);
    });
};


Db.prototype.countRecords = function(callback) {
    callback = callback || EMPTY_FUNCTION;

    this.server.send(OperationTypes.DB_COUNTRECORDS, function(err, result) {

        if (err) { return callback(err); }

        result = result || {};
        callback(null, result.count);
    });
};


Db.prototype.command = function(command, callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
        query_text: command,
        mode: "s"
    };

    this.server.send(OperationTypes.COMMAND, data, function(err, results) {

        if (err) { return callback(err); }

        callback(null, processResults(results));
    });
};


Db.prototype.addDataCluster = function(clusterOptions, callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {};

    switch (clusterOptions.type) {
        case "PHYSICAL":
        case "MEMORY":
            data.type = clusterOptions.type;
            break;
        default:
            data.type = "MEMORY"
    }

    data.name = clusterOptions.name;

    if (data.type === "PHYSICAL") {
        data.file_name = clusterOptions.file_name || "";
    }

    data.dataSegmentName = clusterOptions.dataSegmentName || null;

    this.server.send(OperationTypes.DATACLUSTER_ADD, data, function(err, result) {

        if (err) { return callback(err); }

        callback(null, result.number);
    });
};


Db.prototype.removeDataCluster = function(clusterNumber, callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
        cluster_number: clusterNumber
    };

    this.server.send(OperationTypes.DATACLUSTER_REMOVE, data, callback);
};


Db.prototype.countDataClusters = function(clustersId, callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
        clustersId: clustersId
    };

    this.server.send(OperationTypes.DATACLUSTER_COUNT, data, callback);
};


Db.prototype.rangeDataClusters = function(clusterId, callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
        clusterId: clusterId
    };

    this.server.send(OperationTypes.DATACLUSTER_DATARANGE, data, callback);
};


Db.prototype.createRecord = function(recordData, callback) {
    callback = callback || EMPTY_FUNCTION;

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
        dataSegmentId: recordData.dataSegmentId,
        clusterId: recordData.clusterId,
        content: recordData.content,
        type: recordType,
        mode: 0
    };

    this.server.send(OperationTypes.RECORD_CREATE, data, callback);
};


Db.prototype.loadRecord = function(rid, options, callback) {

    if (parser.typeOfVar(options) === parser.TYPE_FUNCTION) {
        callback = options;
        options = {};
    }

    callback = callback || EMPTY_FUNCTION;

    // TODO allow also rid as object literal (probably merged with options)
    if (!parser.canParseRid(rid)) {
        return callback("The RID must be a string having the format: #<cluster id>:<cluster position>");
    }
    var data = parser.parseRid(rid, callback);
    data.fetchPlan = (parser.typeOfVar(options.fetchPlan) === parser.TYPE_STRING) ? options.fetchPlan : "";
    data.ignoreCache = (parser.typeOfVar(options.ignoreCache) === parser.TYPE_NUMBER) ? options.ignoreCache : 0;

    this.server.send(OperationTypes.RECORD_LOAD, data, function(err, result) {

        if (err) { return callback(err); }

        if (!result) { return callback("A null or undefined record was returned."); }

        var record = processResult(result);
        record["@rid"] = rid;

        callback(null, record);
    });
};

Db.prototype.loadRecords = function(rids, options, callback) {
    if (parser.typeOfVar(options) === parser.TYPE_FUNCTION) {
        callback = options;
        options = {};
    }

    var records = [];
    var ridsLength = rids.length;
    if (ridsLength === 0) {
        return callback(null, records);
    }
    for (var i = 0; i < ridsLength; i++) {
        this.loadRecord(rids[i], options, function(err, record) {
            if (err) { return callback(err); }
            records.push(record);

            if (records.length === ridsLength) {
                return callback(null, records);
            }
        });
    }
};

function processResults(results) {

    var records = [];
    var content = results.content;

    switch (results.status) {

        case 97: // 'a'
            content["@type"] = "f";
            records.push(content);
            break;

        case 108: // 'l'
            for (var i in content) {
                records.push(processResult(content[i]));
            }
            break;

        case 114: // 'r'
            var record = processResult(content);
            records.push(record);
            break;

        case 110: // 'n' null response
            //nothing to do
            break;

        default:
            throw new Error("Unexpected or unimplemented result status: " + results.status);
    }

    return records;
}

function processResult(result) {

    var record;

    switch (result.type) {

        case "b":
        case "f":
            record = {
                "@type": result.type,
                "@version": result.version,
                data: result.content
            };

            break;

        case "d":
            record = parser.deserializeDocument(result.content.toString());
            record["@type"] = "d";
            record["@version"] = result.version;
            record["@rid"] = result.rid;

            break;

        default:
            throw new Error("Invalid or not supported record type: " + result.type);
    }

    return record;
}


Db.prototype.updateRecord = function(recordData, callback) {
    callback = callback || EMPTY_FUNCTION;

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

    if (parser.typeOfVar(recordData.version) === parser.TYPE_NUMBER) {
        data.version = recordData.version;
    } else {
        data.version = -1;
    }

    this.server.send(OperationTypes.RECORD_UPDATE, data, callback);
};

Db.prototype.delete = function(document, callback) {
    var recordData = parser.parseRid(document["@rid"]);
    recordData.version = document["@version"];

    this.deleteRecord(recordData, callback);
};

Db.prototype.deleteRecord = function(recordData, callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
        clusterId: recordData.clusterId,
        clusterPosition: recordData.clusterPosition,
        version: recordData.version,
        mode: 0
    };

    this.server.send(OperationTypes.RECORD_DELETE, data, callback);
};


Db.prototype.save = function(document, callback) {
    callback = callback || EMPTY_FUNCTION;

    if (parser.isNullOrUndefined(document["@class"])) {
        return callback("Document must have a class");
    }

    var self = this;

    var recordData = {};
    recordData.type = "d";

    if (!parser.isNullOrUndefined(document["@rid"])) {
        var rid = document["@rid"];
        if (!parser.canParseRid(rid)) {
            return callback("The RID must be a string having the format: #<cluster id>:<cluster position>");
        }
        parser.mergeHashes(recordData, parser.parseRid(rid));
    }

    if (!parser.isNullOrUndefined(document["@version"])) {
        recordData.version = document["@version"];
    }

    recordData.content = parser.stringToBuffer(parser.serializeDocument(document));

    var saveDocument = function(recordData) {

        if (!parser.isNullOrUndefined(recordData.clusterPosition)) {
            self.updateRecord(recordData, function(err) {

                if (err) { return callback(err); }

                self.loadRecord("#" + recordData.clusterId + ":" + recordData.clusterPosition, callback);
            });
        } else {
            self.createRecord(recordData, function(err, result) {

                if (err) { return callback(err); }

                self.loadRecord("#" + recordData.clusterId + ":" + result.position, callback);
            });
        }
    };

    var cluster = this.getClusterByClass(document["@class"]);

    if (cluster !== null) {
        recordData.clusterId = cluster.id;
        recordData.dataSegmentId = cluster.dataSegmentId;
        saveDocument(recordData);
    } else {
        self.createClass(document["@class"], function(err, clusterId) {

            if (err) { return callback(err); }

            recordData.clusterId = clusterId;
            recordData.dataSegmentId = self.getClusterById(clusterId).dataSegmentId;
            saveDocument(recordData);
        });
    }
};

Db.prototype.cascadingSave = function(masterDocument, callback) {

    var self = this;

    function recursivelyFindObjectsWithClass(parentDocument, parentField, path, pathsAccumulator) {
        var document = parentDocument;
        if (parentField !== null) {
            document = parentDocument[parentField];
        }
        for (var field in document) {
            if (parser.typeOfVar(document[field]) === parser.TYPE_OBJECT) {
                var currentPath;
                if (path !== "") {
                    currentPath = path.concat(".", field);
                } else {
                    currentPath = field;
                }
                recursivelyFindObjectsWithClass(document, field, currentPath, pathsAccumulator);
            }
        }
        if (document["@class"]) {
            pathsAccumulator.push(path);
        }
    }

    var orderedPaths = [];
    recursivelyFindObjectsWithClass(masterDocument, null, "", orderedPaths);

    if (orderedPaths.length === 0) {
        callback("Document cannot be saved");
        return;
    }

    function subElementByPath(document, pathParts, maxDepth) {
        if (parser.isNullOrUndefined(maxDepth)) {
            maxDepth = pathParts.length;
        }
        for (var i = 0; i < maxDepth && pathParts[i] !== ""; i++) {
            document = document[pathParts[i]];
        }
        return document;
    }

    function replaceElementAtPath(document, pathParts, replacement) {
        document = subElementByPath(document, pathParts, pathParts.length - 1);
        document[pathParts[pathParts.length - 1]] = replacement;
    }

    function saveDocumentsByPaths(masterDocument, orderedPaths, savedDocumentsAccumulator, callback) {
        var pathParts = orderedPaths.shift().split(".");
        var document = subElementByPath(masterDocument, pathParts);
        self.save(document, function(err, savedDocument) {
            if (err) { return callback(err); }

            savedDocumentsAccumulator.push(savedDocument);

            if (orderedPaths.length > 0) {
                replaceElementAtPath(masterDocument, pathParts, savedDocument["@rid"]);
                saveDocumentsByPaths(masterDocument, orderedPaths, savedDocumentsAccumulator, callback);
            } else {
                callback();
            }
        });
    }

    function rebuildMasterDocumentFromSavedDocuments(orderedPaths, orderedSavedDocs) {
        //the last saved doc is the saved version of the input master document
        var savedMasterDocument = orderedSavedDocs[orderedSavedDocs.length - 1];
        
        for (var i = 0; i < orderedPaths.length - 1; i++) {
            replaceElementAtPath(savedMasterDocument, orderedPaths[i].split("."), orderedSavedDocs[i]);
        }
        return savedMasterDocument;
    }

    var orderedSavedDocs = [];
    saveDocumentsByPaths(masterDocument, orderedPaths.slice(0), orderedSavedDocs, function(err) {
        if (err) { return callback(err); }

        var newMasterDocument = rebuildMasterDocumentFromSavedDocuments(orderedPaths, orderedSavedDocs);

        callback(null, newMasterDocument);
    });
};

Db.prototype.createClass = function(className, superClassName, callback) {
    if (parser.typeOfVar(superClassName) === parser.TYPE_FUNCTION) {
        callback = superClassName;
        superClassName = null;
    }

    var cluster = this.getClusterByName("default");
    var dataSegment = this.getDataSegmentById(cluster.dataSegmentId);

    var clusterOptions = {
        type: cluster.type,
        name: className,
        dataSegmentName: (dataSegment !== null ? dataSegment.dataName : "internal")
    };

    var self = this;

    self.addDataCluster(clusterOptions, function(err, clusterId) {

        if (err) { return callback(err); }

        var createClassCommand = "create class ".concat(className);
        if (superClassName) {
            createClassCommand = createClassCommand.concat(" extends ").concat(superClassName);
        }
        createClassCommand = createClassCommand.concat(" cluster ").concat(clusterId);
        self.command(createClassCommand, function(err) {

            if (err) { return callback(err); }

            self.reload(function(err) {

                if (err) { return callback(err); }

                callback(null, clusterId);
            });
        });
    });
};


Db.prototype.countRecordsInCluster = function(clusterName, callback) {
    callback = callback || EMPTY_FUNCTION;

    this.server.send(OperationTypes.COUNT, clusterName, function(err, result) {

        if (err) { return callback(err); }

        result = result || {};
        callback(null, result.count);
    });
};
