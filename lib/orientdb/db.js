'use strict';

var Server = require('./server').Server,
    OperationTypes = require('./commands/operation_types'),
    parser = require('./connection/parser'),
    constants = require('./constants.js'),
    Promise = require('bluebird'),
    _ = require('lodash');

function EMPTY_FUNCTION () {}

var Db = exports.Db = function (config) {
  if (!config) {
    throw new Error('OrientDB: Configuration required.');
  }

  this.isOpen = false;
  this.databaseName = config.database_name;
  this.currentProtocolVersion = OperationTypes.CURRENT_PROTOCOL_VERSION;

  //Server instance
  if(config.server instanceof Server) {
    this.server  = config.server;
  }
  else {
    this.server  = new Server(config);
  }

  //Validate database type
  this.databaseType  = config.database_type || 'document';

  switch(this.databaseType) {
    case 'document':
    case 'graph':
      break;
    default:
      this.databaseType  = 'document';
  }

  //Validate storage type
  this.storageType  = config.database_storage || 'local';

  switch(this.storageType) {
    case 'local':
    case 'plocal':
    case 'memory':
      break;
    default:
      this.storageType  = 'local';
  }

  this.db_username  = config.database_username;
  this.db_password  = config.database_password;
  this.clusters    = [];
  this.dataSegments  = [];
  this.transactionId  = 0;
};

Db.prototype.connect  = function () {
  return this.server.connect()
  .bind(this)
  .then(function (results) {
    this.isOpen = false;
    this.serverProtocolVersion = OperationTypes.SERVER_PROTOCOL_VERSION;
    return results;
  });
};

Db.prototype.copy = function (database) {
  database  = database || {};
  return this.server.send(OperationTypes.REQUEST_DB_COPY, {
    databaseUrl: database.url || '',
    databaseUser: database.username || this.db_username,
    databasePass: database.password || this.db_password,
    remoteServerName: database.server_name || '',
    remoteServerEngine: database.server_engine || 'local'
  });
};

Db.prototype.create = function (database) {
  database  = database || {};

  if(!database.name) {
    return Promise.reject(new Error('OrientDB: Database name required to create.'));
  }

  var obj = {};
  obj.databaseName = database.name;

  //Validate database type
  obj.databaseType  = database.type || 'document';

  switch(obj.databaseType) {
    case 'document':
    case 'graph':
      break;
    default:
      obj.databaseType = 'document';
  }

  //Validate storage type
  obj.storageType  = database.storage || 'local';

  switch(self.storageType) {
    case 'local':
    case 'plocal':
    case 'memory':
      break;
    default:
      obj.storageType = 'local';
  }

  return this.server.send(OperationTypes.REQUEST_DB_CREATE, obj);
};

Db.prototype.open = function (database) {
  return this.server.init()
  .bind(this)
  .then(function (results){
    database    = database || {};
    return this.server.send(OperationTypes.REQUEST_DB_OPEN, {
      databaseName: database.name || this.databaseName,
      databaseType: database.type || this.databaseType,
      userName: database.username || this.db_username,
      userPassword: database.password || this.db_password
    });
  })
  .then(function (results) {
    this.serverProtocolVersion  = OperationTypes.SERVER_PROTOCOL_VERSION;

    //Save the session ID in the server and the clusters in the DB
    this.server.sessionId    = results.sessionId;
    this.clusters        = results.clusters;

    return results;
  });
};

Db.prototype.size = function () {
  return this.server.send(OperationTypes.REQUEST_DB_SIZE);
};


/* Database */
Db.prototype.close = function () {
  return this.server.close();
}

Db.prototype.countRecords = function () {
  return this.server.send(OperationTypes.REQUEST_DB_COUNTRECORDS);
};

Db.prototype.reload = function () {
  return this.server.send(OperationTypes.REQUEST_DB_RELOAD)
  .bind(this)
  .then(function (results) {
    this.clusters = results.clusters;
    return results;
  });
};

Db.prototype.command = Db.prototype.query = function (command, options) {
  options    = options || {};

  var data  = {
    queryText:command,
    mode:'s',
    fetchPlan:'',
    nonTextLimit:-1,
    className:'com.orientechnologies.orient.core.sql.OCommandSQL'
  };

  if(_.isString(options.fetchPlan)) {
    data.fetchPlan    = options.fetchPlan;
    data.mode      = 'a';
  }
  if(_.isNumber(options.nonTextLimit)) {
    data.nonTextLimit  = options.nonTextLimit;
    data.mode      = 'a';
  }
  if(options.mode === 'a') {
    data.mode = options.mode;
  }
  if(data.mode === 'a') {
    data.className    = 'com.orientechnologies.orient.core.sql.query.OSQLAsynchQuery';
  }
  if(options.params && !_.isEmpty(options.params)) {
    if(_.isArray(options.params)) {
      var params  = {};
      for (var idx = 0, length = options.params.length; idx < length; idx++) {
        params[idx]  = options.params[idx];
      }
      data.params = { params: params };
    }
    else if (_.isObject(options.params)) {
      data.params = { params: options.params };
    }
  }

  return this.server.send(OperationTypes.REQUEST_COMMAND, data)
  .then(processResults);
};


/* Records */
Db.prototype.recordLoad = function (record) {

  function onLoadRecord(record) {
    //If user includes the record id, parse to get cluster details
    var rid  = parser.parseRid(record);

    if(!rid.recordId) {
      return Promise.reject(new Error('OrientDB: Record Load: Record ID required.'));
    }

    var options = record['@options'] || {},
        data = {
          clusterId:rid.clusterId,
          clusterPosition:rid.clusterPosition,
          fetchPlan: options.fetchPlan || '',
          ignoreCache: options.ignoreCache || 0,
          loadTombstones: options.loadTombstones || 0
        };

    return this.server.send(OperationTypes.REQUEST_RECORD_LOAD, data)
    .then(function (results) {
      if (!results) {
        return Promise.reject(new Error('OrientDB: Record Load: A null or undefined record was returned.'));
      }
      else if (results.status === 0) {
        return Promise.reject(new Error('OrientDB: Record Load: Record #' + rid.clusterId + ':' + rid.clusterPosition + ' does not exist'));
      }

      return processResult(results, results.subcontents);
    })
    .then(function (item) {
      if (item)
        item['@rid'] = rid.recordId;
      return item;
    });
  }

  return Array.isArray(record) ? Promise.all(record.map(onLoadRecord, this)) : onLoadRecord.call(this, record);
};

Db.prototype.recordCreate = function (record) {
  var clazz = record['@class'] || '',
      clusterId;

  if(record['@rid'] && record['@rid'].clusterId) {
    clusterId = record['@rid'].clusterId;
  }
  else if(clazz !== '') {
    var cluster = this.getClusterByName(clazz);

    if(!parser.isNullOrUndefined(cluster)) {
      clusterId = cluster.id;
    }
    else {
      return Promise.reject(new Error('OrientDB: Record Create: Cluster ID and/or class is invalid.'));
    }
  }
  else {
    return Promise.reject(new Error('OrientDB: Record Create: Cluster ID and/or class is invalid.'));
  }

  var options    = record['@options'] || {},
      data  = {
        dataSegmentId: options.dataSegmentId && _.isNumber(options.dataSegmentId) ? options.dataSegmentId : -1,
        clusterId: clusterId,
        content: parser.encodeRecordData(record),
        type: parser.decodeRecordType('d'),
        mode: options.mode && options.mode ? parseInt(options.mode) : 0
      };

  return this.server.send(OperationTypes.REQUEST_RECORD_CREATE, data)
  .then(function (results) {
    record['@rid'] = '#'+clusterId+':'+results.position;
    record['@version'] = results.version;
    return record;
  });
};

Db.prototype.recordUpdate = function (record) {
  var rid      = parser.parseRid(record['@rid']);

  if(!rid.recordId) {
    return Promise.reject(new Error('OrientDB: Record Update: Record ID is invalid.'))
  }

  record['@rid']  = rid.recordId;
  var options    = record['@options'] || {};
  var type    = parser.decodeRecordType('d');
  record['@type']  = 'd';

  var version    = !parser.isNullOrUndefined(record['@version']) ? parseInt(record['@version']) : -1;
  var mode    = !parser.isNullOrUndefined(options.mode) ? parseInt(options.mode) : 0;
  var preserve  = !parser.isNullOrUndefined(options.preserve) ? parseInt(options.preserve) : 0;

  function onUpdate(results) {
    if (results) {
      for(var k in record) {
        results[k]  = record[k];
      }
      record  = results;
    }

    var content  = parser.encodeRecordData(record),
        data  = {
          clusterId: rid.clusterId,
          clusterPosition: rid.clusterPosition,
          content: content,
          type: type,
          version: version,
          mode: mode
        };

    return this.server.send(OperationTypes.REQUEST_RECORD_UPDATE, data)
    .bind(this)
    .then(function (results) {
      //Update record params
      delete record['@options'];
      record['@version']  = results.version;
      record['@class']  = this.getClusterById(rid.clusterId).name;

      return record;
    });
  }

  if(preserve) {
    return this.recordLoad(rid)
    .bind(this)
    .then(onUpdate);
  } else {
    return onUpdate.call(this);
  }
};

Db.prototype.recordDelete = function (record) {
  record    = record || {};

  var rid;

  if(_.isObject(record)) {
    rid  = parser.parseRid(record['@rid']);
  } else {
    rid  = parser.parseRid(record);
  }

  if(!rid.recordId) {
    return Promise.reject(new Error('OrientDB: Record Delete: Record ID is invalid.'))
  }

  var options  = record['@options'] || {},
      data  = {
        clusterId: rid.clusterId,
        clusterPosition: rid.clusterPosition,
        version: !parser.isNullOrUndefined(record['@version']) ? parseInt(record['@version']) : -1,
        mode: !parser.isNullOrUndefined(options.mode) ? parseInt(options.mode) : 0
      };

  return this.server.send(OperationTypes.REQUEST_RECORD_DELETE, data);
};

Db.prototype.recordMetadata = function (record) {
  if(OperationTypes.SERVER_PROTOCOL_VERSION < 14) {
    return Promise.reject(new Error('OrientDB: Record Metadata: This functionality is is only available in protocol 14 and above. This protocol is available starting with OrientDB 1.4.'))
  }

  var rid  = parser.parseRid(record);

  if (!rid.recordId) {
    return Promise.reject(new Error('OrientDB: Record Metadata: Record ID is invalid.'))
  }

  var data  = {
    clusterId: rid.clusterId,
    clusterPosition: rid.clusterPosition
  };

  return this.server.send(OperationTypes.REQUEST_RECORD_METADATA, data)
  .then(function (results) {
    var record  = {};
    record['@rid']    = rid.recordId;
    record['@type']    = 'd';
    record['@version']  = results.version;
    var clazz = this.getClusterById(rid.clusterId).name;
    if(clazz) {
      record['@class']  = clazz;
    }
    return record;
  });
};

Db.prototype.positionsHigher = function (record) {
  return makePositionFunc.call(this, OperationTypes.REQUEST_POSITIONS_HIGHER, record);
};

Db.prototype.positionsLower = function (record) {
  return makePositionFunc.call(this, OperationTypes.REQUEST_POSITIONS_LOWER, record);
};

Db.prototype.positionsCeiling = function (record) {
  return makePositionFunc.call(this, OperationTypes.REQUEST_POSITIONS_CEILING, record);
};

Db.prototype.positionsFloor = function (record) {
  return makePositionFunc.call(this, OperationTypes.REQUEST_POSITIONS_FLOOR, record);
};

function makePositionFunc(operation, record) {
  if(OperationTypes.SERVER_PROTOCOL_VERSION < 13) {
    return Promise.reject(new Error('OrientDB: This method is currently available with OrientDB 1.3+'));
  }

  var rid  = parser.parseRid(record);

  if (!rid.recordId) {
    return Promise.reject(new Error('OrientDB: Record Positions: Record ID is invalid.'))
  }

  var data  = {
    clusterId: rid.clusterId,
    clusterPosition: rid.clusterPosition
  };

  return this.server.send(operation, data);
}

Db.prototype.recordCleanOut = function (record) {
  if (OperationTypes.SERVER_PROTOCOL_VERSION < 13) {
    return Promise.reject(new Error('OrientDB: This method is currently available with OrientDB 1.3+'));
  }

  var rid  = parser.parseRid(record);

  if (!rid.recordId) {
    return Promise.reject(new Error('OrientDB: Record Metadata: Record ID is invalid.'))
  }

  var version  = !parser.isNullOrUndefined(record['@version']) ? parseInt(record['@version']) : -1,
      options  = record['@options'] || {};

  return this.server.send(OperationTypes.REQUEST_RECORD_CLEAN_OUT, {
    clusterId:rid.clusterId,
    clusterPosition:rid.clusterPosition,
    version:version,
    mode: options.mode ? parseInt(options.mode) : 0
  });
}

/* Data Cluster */
Db.prototype.dataClusterAdd  = function (cluster) {
  var data  = {};

  cluster = cluster || {};
  data.type  = cluster.type;

  if (data.type !== 'memory')
    data.type = 'physical';

  data.name  = cluster.name;

  if (data.type === 'physical') {
    data.location = cluster.location || '';
  }

  data.clusterId = cluster.clusterId || -1;
  data.dataSegmentName = cluster.dataSegmentName || null;

  return this.server.send(OperationTypes.REQUEST_DATACLUSTER_ADD, data)
};

Db.prototype.dataClusterDrop = function (clusterId) {
  return this.server.send(OperationTypes.REQUEST_DATACLUSTER_DROP, {
    clusterId: parseInt(clusterId, 10)
  });
};

Db.prototype.dataClusterCount = function (clusterIds, loadTombstones) {
  return this.server.send(OperationTypes.REQUEST_DATACLUSTER_COUNT, {
    clusterIds: Array.isArray(clusterIds) ? clusterIds : [clusterIds],
    loadTombstones: loadTombstones || 0
  });
};

Db.prototype.dataClusterDataRange = function (clusterId) {
  return this.server.send(OperationTypes.REQUEST_DATACLUSTER_DATARANGE, {
    clusterId: parseInt(clusterId, 10)
  });
};

/*
Db.prototype.dataClusterCopy = function (clusterId) {
    var data = {
        clusterId: clusterId
    };

    this.server.send(OperationTypes.REQUEST_DATACLUSTER_COPY, data);
};
*/

/*
Db.prototype.isLHClustersUsed = function () {

    // older versions do not support this command
    if (OperationTypes.SERVER_PROTOCOL_VERSION < 13) {
        return reject(Error('OrientDB: isLHClustersUsed available since OrientDB 1.3'));
    }

    this.server.send(OperationTypes.REQUEST_DATACLUSTER_LH_CLUSTER_IS_USED, null);
};
*/

/* Data Segment */
Db.prototype.dataSegmentAdd = function (segmentName, segmentLocation) {
  return this.server.send(OperationTypes.REQUEST_DATASEGMENT_ADD, {
    segmentName: segmentName || '',
    segmentLocation: segmentLocation || ''
  })
  .bind(this)
  .then(this.reload);
};

Db.prototype.dataSegmentDrop = function (segmentName) {
  return this.server.send(OperationTypes.REQUEST_DATASEGMENT_DROP, segmentName)
  .bind(this)
  .then(this.reload);
};


/* Utils */
function processResults(results) {
  var records = [];
  var content = results.content;

  switch (results.status) {
    case 97: // 'a'
      content['@type'] = 'f';
      records.push(content);
      break;
    case 1:
    case 108: // 'l'
    case 114: // 'r'
      for (var idx = 0, length = content.length; idx < length; idx++) {
        var item  = processResult(content[idx], results.subcontents);
        if(item) {
          records.push(item);
        }
      }
      break;
    case 0:
    case 110: // 'n'
      //nothing to do
      break;
    default:
      throw new Error('OrientDB: Unexpected or unimplemented result status: ' + results.status);
  }

  return records;
}

function processResult(content, subcontents) {
  var record;
  switch (content.type) {
    case 'b':
    case 'f':
      record = {
        '@type': content.type,
        '@version': content.version,
        data: content.content
      };
      break;

    case 'd':
      if (parser.isNullOrUndefined(content.content)) {
        record = {};
      }
      else {
        record = parser.deserializeDocument(content.content.toString());
      }

      record['@type']  = 'd';

      if (!parser.isNullOrUndefined(content.version)) {
        record['@version']  = content.version;
      }

      record['@rid']  = content.rid;

      if (subcontents) {
        var subRecords = [];
        for (var idx = 0, length = subcontents.length; idx < length; idx++) {
          var item = processResult(subcontents[idx], null);
          if (item) {
            subRecords.push(item);
          }
        }
        recursivelyReplaceSubRecordsInRecord(record, subRecords, [record['@rid']]);
      }
      break;
    default:
      throw new Error('OrientDB: Invalid or not supported record type: ' + content.type);
  }

  return record;
}

function recursivelyReplaceSubRecordsInRecord(currentRecord, subRecords, accumulatedRIDs) {
  var ridsInRecord = [];
  collectRIDsIn(currentRecord, ridsInRecord);

  for (var idx = 0, length = ridsInRecord.length; idx < length; idx++) {
    var ridInRecord = ridsInRecord[idx];

    if (accumulatedRIDs.indexOf(ridInRecord.rid) === -1) {
      var subRecord = _.find(subRecords, function (record) {
        return record["@rid"] === ridInRecord.rid;
      });

      if (!parser.isNullOrUndefined(subRecord)) {
        ridInRecord.container[ridInRecord.key] = parser.deepClone(subRecord);
        subRecord = ridInRecord.container[ridInRecord.key];
        var newAccumulatedRIDs = accumulatedRIDs.slice(0);
        newAccumulatedRIDs.push(subRecord["@rid"]);
        recursivelyReplaceSubRecordsInRecord(subRecord, subRecords, newAccumulatedRIDs);
      }
    }
  }
}

function collectRIDsIn(obj, accumulator, container, key) {
  if (_.isArray(obj)) {
    for (var idx = 0, length = obj.length; idx < length; idx++) {
      collectRIDsIn(obj[idx], accumulator, obj, idx);
    }
  }
  else if (_.isPlainObject(obj)) {
    for (var field in obj) {
      if (field[0] !== "@") {
        collectRIDsIn(obj[field], accumulator, obj, field);
      }
    }
  }
  else if (parser.canParseRid(obj)) {
    accumulator.push({ rid: obj, container: container, key: key });
  }
}


// @todo refactor to use promises

Db.prototype.cascadingSave = function (masterDocument, transaction, callback) {
  if (_.isFunction (transaction)) {
    callback = transaction;
    transaction = null;
  }

  callback = callback || EMPTY_FUNCTION;

  var self = this;

  function recursivelyFindObjectsWithClass(document, path, pathsAccumulator) {
    for (var field in document) {
      var fieldValue = document[field];
      if (_.isArray(fieldValue) || _.isPlainObject(fieldValue)) {
        var currentPath;
        if (path !== "") {
          currentPath = path.concat(".", field);
        }
        else {
          currentPath = field;
        }
        if (_.isArray(fieldValue)) {
          for (var idx = 0, length = fieldValue.length; idx < length; idx++) {
            var currentPathWithIdx = currentPath.concat(".", idx);
            recursivelyFindObjectsWithClass(fieldValue[idx], currentPathWithIdx, pathsAccumulator);
          }
        }
        else if (_.isPlainObject(fieldValue)) {
          recursivelyFindObjectsWithClass(fieldValue, currentPath, pathsAccumulator);
        }
      }
    }
    if (document["@class"]) {
        pathsAccumulator.push(path);
    }
  }

  var orderedPaths = [];
  recursivelyFindObjectsWithClass(masterDocument, "", orderedPaths);

  if (orderedPaths.length === 0) {
    return callback(new Error('OrientDB: Document cannot be saved'));
  }

  function subElementByPath(document, pathParts, maxDepth) {
    if (parser.isNullOrUndefined(maxDepth)) {
      maxDepth = pathParts.length;
    }
    for (var idx = 0; idx < maxDepth && pathParts[idx] !== ""; idx++) {
      document = document[pathParts[idx]];
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
    self._saveRecord(document, function (error, savedDocument) {
      if(error) {
         return callback(error);
      }

      savedDocumentsAccumulator.push(savedDocument);

      if (orderedPaths.length > 0) {
        replaceElementAtPath(masterDocument, pathParts, savedDocument["@rid"]);
        saveDocumentsByPaths(masterDocument, orderedPaths, savedDocumentsAccumulator, callback);
      }
      else {
        callback();
      }
    });
  }

  function rebuildMasterDocumentFromSavedDocuments(orderedPaths, orderedSavedDocs) {
    //the last saved doc is the saved version of the input master document
    var savedMasterDocument = orderedSavedDocs[orderedSavedDocs.length - 1];

    for (var idx = orderedPaths.length - 2; idx >= 0; idx--) {
      replaceElementAtPath(savedMasterDocument, orderedPaths[idx].split("."), orderedSavedDocs[idx]);
    }

    return savedMasterDocument;
  }

  var orderedSavedDocs = [];
  saveDocumentsByPaths(masterDocument, orderedPaths.slice(0), orderedSavedDocs, function (error) {
      if (error) {
        return callback(error);
      }
      var newMasterDocument = rebuildMasterDocumentFromSavedDocuments(orderedPaths, orderedSavedDocs);
      callback(null, newMasterDocument);
  });
};

Db.prototype.classCreate = function (classData) {
  var className, classSuper;

  if(_.isObject(classData)) {
    className  = classData.name || '';
    classSuper  = classData.super || '';
  }
  else {
    className  = classData || '';
    classSuper  = '';
  }

  function onClassCreate(className, clusterId) {
    var createCommand  = 'CREATE CLASS ' + className;

    if(classSuper !== '') {
      createCommand  += ' extends ' + classSuper;
    }

    createCommand  += ' cluster ' + clusterId;

    return this.query(createCommand)
    .bind(this)
    .then(this.reload)
    .then(function (results) {
      return {
        clusterId: clusterId,
        class: className
      };
    });
  }

  var cluster  = this.getClusterByName(className);

  if (parser.isNullOrUndefined(cluster)) {
    var dataSegment  = this.getDataSegmentById(cluster.dataSegmentId);

    var clusterOptions = {
      type: cluster.type,
      name: className,
      dataSegmentName: (dataSegment !== null ? dataSegment.dataName : 'internal')
    };

    return this.dataClusterAdd(clusterOptions)
    .bind(this)
    .then(function (results) {
      return onClassCreate.call(this, className, results.clusterId);
    });
  }
  else {
    return onClassCreate.call(this, className, cluster.id);
  }
};

Db.prototype.classDrop = function (classData) {
  var className;

  if(_.isObject(classData)) {
    className  = classData.name || '';
  }
  else {
    className  = classData || '';
  }

  return this.query('DROP CLASS ' + className)
  .bind(this)
  .then(this.reload)
  .then(function () {
    return 1;
  });
};

Db.prototype.countRecordsInCluster = function (clusterName) {
  return this.server.send(OperationTypes.COUNT, clusterName)
  .then(function (results) {
    return (results || {}).count || 0;
  });
};

Db.prototype.begin = function () {
  var transaction = {
        id: this.transactionId,
        clusterPosition: -1,
        actions: [],
        docs: []
      };

  this.transactionId++;

  return transaction;
};

Db.prototype.rollback = function (transaction) {
  for (var key in transaction) {
    delete transaction[key]
  }
};

// @fixme the below is broken, not fully promisified

Db.prototype.commit = function (transaction, callback) {
    if (parser.isNullOrUndefined(transaction.id) || parser.isNullOrUndefined(transaction.clusterPosition) || parser.isNullOrUndefined(transaction.actions) || transaction.actions.length === 0) {
        return callback(new Error('OrientDB: Invalid transaction: ' + JSON.stringify(transaction)));
    }

    callback  = callback || EMPTY_FUNCTION;

    this.server.send(OperationTypes.REQUEST_TX_COMMIT, transaction)
    .then(function (txResult) {
      function recordCreatedToRID(recordCreated) {
        return parser.toRid(recordCreated.fromClusterId, recordCreated.fromClusterPosition);
      }

      function recordUpdatedToRID(recordUpdated) {
        return parser.toRid(recordUpdated.clusterId, recordUpdated.clusterPosition);
      }

      function lookupDoc(recordCreatedOrUpdated, toRIDFunction, callback) {
        var rid = toRIDFunction (recordCreatedOrUpdated);
        for (var idx = 0, length = transaction.docs.length; idx < length; idx++) {
          var doc = transaction.docs[idx];
          if (rid === doc["@rid"]) {
            return callback(null, recordCreatedOrUpdated, doc);
          }
        }
        callback("RID " + rid + " not found docs");
      }

      var tempToActualRIDMap = {};
      var recordsCreated = txResult.recordsCreated;
      for (var idx = 0, length = recordsCreated.length; idx < length; idx++) {
        var recordCreated = recordsCreated[idx];
        lookupDoc(recordCreated, recordCreatedToRID, function (error, recordCreated, doc) {
          if(error) {
            return callback(error);
          }

          doc["@rid"] = parser.toRid(recordCreated.toClusterId, recordCreated.toClusterPosition);
          doc["@version"] = 0;

          tempToActualRIDMap[recordCreatedToRID(recordCreated)] = doc["@rid"];
        });
      }
      var recordsUpdated = txResult.recordsUpdated;
      for (var idx = 0, length = recordsUpdated.length; idx < length; idx++) {
        var recordUpdated = recordsUpdated[idx];
        lookupDoc(recordUpdated, recordUpdatedToRID, function (error, recordUpdated, doc) {
          if(error) {
            return callback(error);
          }

          doc["@version"] = recordUpdated.version;
        });
      }

      function recursivelyReplaceAllTempRIDs(doc) {
        for (var field in doc) {
          var fieldValue = doc[field];
          if (_.isString(fieldValue) && parser.canParseRid(fieldValue) && tempToActualRIDMap.hasOwnProperty(fieldValue)) {
            doc[field] = tempToActualRIDMap[fieldValue];
          } else if (_.isPlainObject(fieldValue)) {
            recursivelyReplaceAllTempRIDs(fieldValue);
          }
        }
      }

      for (var idx = 0, length = transaction.docs.length; idx < length; idx++) {
        recursivelyReplaceAllTempRIDs(transaction.docs[idx]);
      }

          resolve(txResult);
      })
    .error(function (error) {
      reject(error)
    });
};

Db.prototype.getClusterByName = function (clusterName) {
  clusterName  = clusterName.toLowerCase();

  for(var g=0; g<this.clusters.length; g++) {
    if(this.clusters[g].name === clusterName) {
      return this.clusters[g];
    }
  }

  return null;
};

Db.prototype.getClusterById  = function (clusterId) {
  for (var idx = 0, length = this.clusters.length; idx < length; idx++) {
    if (this.clusters[idx].id === clusterId) {
      return this.clusters[idx];
    }
  }

  return null;
};

Db.prototype.getDataSegmentById = function (dataSegmentId) {
  for (var g=0; g<this.clusters.length; g++) {
    if(this.clusters[g].dataSegmentId === dataSegmentId) {
      return this.clusters[g];
    }
  }

  return null;
};

Db.prototype.getClassByName = function (className) {
  for (var idx = 0, length = this.classes.length; idx < length; idx++) {
    if (this.classes[idx].name === className || this.classes[idx].shortName === className) {
      return this.classes[idx];
    }
  }

  return null;
};
