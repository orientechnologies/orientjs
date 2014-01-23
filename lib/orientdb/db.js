'use strict';

var Server			= require('./connection/server').Server;
var OperationTypes	= require('./commands/operation_types');
var parser			= require('./connection/parser');
var constants		= require('./constants.js');
var _				= require('lodash');

function EMPTY_FUNCTION() {}

var Db = exports.Db = function(config) {
	if (!config) {
		throw new Error('OrientDB: Configuration required.');
	}

	this.databaseName			= config.database_name;
	this.currentProtocolVersion	= OperationTypes.CURRENT_PROTOCOL_VERSION;

	//Server instance
	if(config.server instanceof Server) {
        this.server	= server;
    } else {
    	this.server	= new Server({
			'userName':config.server_username,
			'userPassword':config.server_password,
			'host':config.server_host,
			'port':config.server_port
    	});
    }

	//Validate database type
	this.databaseType	= config.database_type || 'document';

	switch(this.databaseType) {
		case 'document':
		case 'graph':
			break;
		default:
			this.databaseType	= 'document';
	}

	//Validate storage type
	this.storageType	= config.database_storage || 'local';

	switch(this.storageType) {
		case 'local':
		case 'plocal':
		case 'memory':
			break;
		default:
			this.storageType	= 'local';
	}

    this.db_username	= config.database_username;
    this.db_password	= config.database_password;
    this.clusters		= [];
	this.dataSegments	= [];
    this.transactionId	= 0;
};

/* Server */
Db.prototype.close = function() {
	this.server.send(OperationTypes.REQUEST_DB_CLOSE, EMPTY_FUNCTION);
};

Db.prototype.configGet = function(key, callback) {
	callback	= callback || EMPTY_FUNCTION;

	var data	= {
		key:key
	};

	this.server.send(OperationTypes.REQUEST_CONFIG_GET, data, callback);
};

Db.prototype.configList = function(callback) {
	callback	= callback || EMPTY_FUNCTION;
	this.server.send(OperationTypes.REQUEST_CONFIG_LIST, callback);
};

Db.prototype.configSet = function(key, value, callback) {
	callback	= callback || EMPTY_FUNCTION;

	var data	= {
		key:key,
		value:value
	};

	this.server.send(OperationTypes.REQUEST_CONFIG_SET, data, callback);
};

Db.prototype.connect = function(callback) {
	var self	= this;
	callback	= callback || EMPTY_FUNCTION;

	self.server.connect(function(error, results) {
		self.serverProtocolVersion	= OperationTypes.SERVER_PROTOCOL_VERSION;
		return callback(error, results);
	});
};

Db.prototype.copy = function(database, callback) {
	callback	= callback || EMPTY_FUNCTION;
	database	= database || {};

	var databaseUrl			= database.url || '';
	var databaseUser		= database.username || this.db_username;
	var databasePass		= database.password || this.db_password;
	var remoteServerName	= database.server_name || '';
	var remoteServerEngine	= database.server_engine || 'local';

	var data	= {
		databaseUrl:databaseUrl,
		databaseUser:databaseUser,
		databasePass:databasePass,
		remoteServerName:remoteServerName,
		remoteServerEngine:remoteServerEngine
	};

	this.server.send(OperationTypes.REQUEST_DB_COPY, data, callback);
};

Db.prototype.create = function(database, callback) {
	callback	= callback || EMPTY_FUNCTION;
	database	= database || {};

	if(!database.name) {
		return callback(new Error('OrientDB: Database name required to create.'));
	}

	var obj				= {};
	obj.databaseName	= database.name;

	//Validate database type
	obj.databaseType	= database.type || 'document';

	switch(obj.databaseType) {
		case 'document':
		case 'graph':
			break;
		default:
			obj.databaseType	= 'document';
	}

	//Validate storage type
	obj.storageType	= database.storage || 'local';

	switch(this.storageType) {
		case 'local':
		case 'plocal':
		case 'memory':
			break;
		default:
			obj.storageType		= 'local';
	}

    this.server.send(OperationTypes.REQUEST_DB_CREATE, obj, callback);
};

Db.prototype.drop = Db.prototype.delete = function(database, callback) {
	callback			= callback || EMPTY_FUNCTION;
	database			= database || {};

	var databaseName	= database.name || '';
	var storageType		= database.storage || 'local';

	if(database.name == '') {
		callback(new Error('OrientDB: Database name is required.'));
	}

	var database	= {
		databaseName: databaseName,
		storageType:storageType
	};

    this.server.send(OperationTypes.REQUEST_DB_DROP, database, callback);
};

Db.prototype.exist = function(name, type, callback) {
	if(_.isFunction(type)) {
		callback	= type;
		type		= 'local';
	}

	callback	= callback || EMPTY_FUNCTION;
	type		= type || 'local';

	var data	= {
		databaseName: name,
		serverStorageType:type
	};

	this.server.send(OperationTypes.REQUEST_DB_EXIST, data, function(error, results) {
		if(error) {
			return callback(error);
		}

		results	= results.result || 0;
		callback(null, results);
	});
};

Db.prototype.list = function(callback) {
	callback = callback || EMPTY_FUNCTION;

	this.server.send(OperationTypes.REQUEST_DB_LIST, function(error, results) {
		if(error) {
			return callback(error);
		}

		results	= results || {};
		callback(null, results);
	});
};

Db.prototype.open = function(database, callback) {
	var self	= this;

	if(_.isFunction(database)) {
		callback	= database;
	}

	database	= database || {};
	callback	= callback || EMPTY_FUNCTION;

	var name		= database.name || self.databaseName;
	var type		= database.type || self.databaseType;
	var username	= database.username || self.db_username;
	var password	= database.password || self.db_password;

	//For the open operation we want to do some DB and server initialization
	var onOpen = function(error, results) {
		if(error) {
			return callback(error);
		}

		this.serverProtocolVersion	= OperationTypes.SERVER_PROTOCOL_VERSION;

		// save the session ID in the server and the clusters in the DB
		// TODO: the clusters also have to be updated with the cluster commands
		self.server.sessionId	= results.sessionId;
		self.clusters			= results.clusters;

		// retrieve the DB schema and save it
		// TODO: the schema also needs to be update if this changes
		//      (I am not sure if this is currently supported in the protocol)
		//loadDbSchema(self, callback);
		callback(null, results)
	};

	var data = {
		databaseName: name,
		databaseType: type,
		userName: username,
		userPassword: password
	};

	self.server.init(function(error) {
		if(error) {
			return callback(error);
		}

		self.server.send(OperationTypes.REQUEST_DB_OPEN, data, onOpen);
	});
};

Db.prototype.shutdown = function(callback) {
	callback	= callback || EMPTY_FUNCTION;

	var data	= {
		username:this.server.userName,
		password:this.server.userPassword
	};

	this.server.send(OperationTypes.REQUEST_SHUTDOWN, data, function(error, results) {
		if(error) {
			return callback(error);
		}

		results.status	= 1;
		callback(null, results);
	});
};

Db.prototype.size = function(callback) {
	callback	= callback || EMPTY_FUNCTION;
	this.server.send(OperationTypes.REQUEST_DB_SIZE, callback);
};


/* Database */
Db.prototype.countRecords = function(callback) {
	callback	= callback || EMPTY_FUNCTION;
	this.server.send(OperationTypes.REQUEST_DB_COUNTRECORDS, callback);
};

Db.prototype.reload = function(callback) {
	var self	= this;
	callback	= callback || EMPTY_FUNCTION;

	var onReload = function(error, results) {
		if(error) {
			return callback(error);
		}

		self.clusters	= results.clusters;
		callback(error, results);
	};

	this.server.send(OperationTypes.REQUEST_DB_RELOAD, onReload);
};

Db.prototype.command = Db.prototype.query = function(command, options, callback) {
    if(_.isFunction(options)) {
        callback	= options;
        options		= {};
    }

    callback	= callback || EMPTY_FUNCTION;
    options		= options || {};

    var data	= {
        queryText:command,
        mode:'s',
        fetchPlan:'',
        nonTextLimit:-1,
        className:'com.orientechnologies.orient.core.sql.OCommandSQL'
    };
    
    if(_.isString(options.fetchPlan)) {
        data.fetchPlan		= options.fetchPlan;
        data.mode			= 'a';
    }
    if(_.isNumber(options.nonTextLimit)) {
        data.nonTextLimit	= options.nonTextLimit;
        data.mode			= 'a';
    }
    if(data.mode === 'a') {
        data.className		= 'com.orientechnologies.orient.core.sql.query.OSQLAsynchQuery';
    }
    if(options.params && !_.isEmpty(options.params)) {
        if(_.isArray(options.params)) {
            var params	= {};

			for (var idx = 0, length = options.params.length; idx < length; idx++) {
                params[idx]	= options.params[idx];
            }

			data.params = { params: params };
        } else if (_.isObject(options.params)) {
            data.params = { params: options.params };
        }
    }

    var self	= this;

    self.server.send(OperationTypes.REQUEST_COMMAND, data, function(error, results) {
        if(error) {
        	return callback(error);
        }

        results	= processResults(results);
        toRidsFromORIDsOfDocuments(self, results, callback);
    });
};


/* Records */
Db.prototype.recordLoad = function(record, callback) {
	var self = this;

	if(_.isArray(record)) {
		return self._recordLoadList(record, callback);
	}

	callback = callback || EMPTY_FUNCTION;


	//If user includes the record id, parse to get cluster details
	var rid	= parser.parseRid(record);

	if(!rid.recordId) {
		return callback(new Error('OrientDB: Record ID required.'));
	}

	var options			= record['@options'] || {};
	var fetchPlan		= options.fetchPlan || '';
	var ignoreCache		= options.ignoreCache || 0;
	var loadTombstones	= options.loadTombstones || 0;

	var data			= {
		clusterId:rid.clusterId,
		clusterPosition:rid.clusterPosition,
		fetchPlan:fetchPlan,
		ignoreCache:ignoreCache,
		loadTombstones:loadTombstones
	};

	self.server.send(OperationTypes.REQUEST_RECORD_LOAD, data, function(error, results) {
		if (error) {
			return callback(error);
		}

		if (!results) {
			return callback(new Error('OrientDB: A null or undefined record was returned.'));
		}

		if (results.status === 0) {
			return callback(new Error('OrientDB: Record #' + rid.clusterId + ':' + rid.clusterPosition + ' does not exist'));
		}

		// TODO: review response of RecordLoad
		var record = processResult(results, results.subcontents);
		record['@rid'] = rid.recordId;

		toRidsFromORIDsOfDocument(self, record, callback);
	});
};

Db.prototype._recordLoadList = function(record, callback) {
	var records		= [];
	var ridsLength	= record['@rid'].length;

	if(ridsLength === 0) {
		return callback(null, records);
	}

	for (var g=0; g<ridsLength; g++) {
		var data		= JSON.parse(JSON.stringify(record));;
		data['@rid']	= record['@rid'][g].recordId;

		this.recordLoad(data, function(error, record) {
			if(error) {
				return callback(error);
			}

			records.push(record);

			if (records.length === ridsLength) {
				return callback(null, records);
			}
		});
	}
};

Db.prototype.recordCreate = function(record, callback) {
	callback = callback || EMPTY_FUNCTION;

	var clazz			= record['@class'] || '';
	var clusterId;

	if(record['@rid'] && record['@rid'].clusterId) {
		clusterId	= record['@rid'].clusterId;
	} else if(clazz !== '') {
		var cluster	= this.getClusterByName(clazz);

		if(!parser.isNullOrUndefined(cluster)) {
			clusterId	= cluster.id;
		} else {
			return callback(new Error('OrientDB: Record Create: Cluster ID and/or class is invalid.'));
		}
	} else {
		return callback(new Error('OrientDB: Record Create: Cluster ID and/or class is invalid.'));
	}

	var content		= parser.encodeRecordData(record);
	var options		= record['@options'] || {};
	var segmentId	= options.dataSegmentId && _.isNumber(options.dataSegmentId) ? options.dataSegmentId : -1;
	var mode		= options.mode && options.mode ? parseInt(options.mode) : 0;
	var type		= parser.decodeRecordType('d');

	var data	= {
		dataSegmentId: segmentId,
		clusterId: clusterId,
		content: content,
		type: type,
		mode: mode
	};

	this.server.send(OperationTypes.REQUEST_RECORD_CREATE, data, function(error, results){
		if(error) {
			return callback(error);
		}

		record['@rid']		= '#'+clusterId+':'+results.position;
		record['@version']	= results.version;
		callback(null, record);
	});
};

Db.prototype.recordUpdate = function(record, callback) {
	var self	= this;
	callback	= callback || EMPTY_FUNCTION;

	var rid			= parser.parseRid(record['@rid']);

	if(!rid.recordId) {
		return callback(new Error('OrientDB: Record Update: Record ID is invalid.'))
	}

	record['@rid']	= rid.recordId;
	var options		= record['@options'] || {};
	var type		= parser.decodeRecordType('d');
	record['@type']	= 'd';

	var version		= !parser.isNullOrUndefined(record['@version']) ? parseInt(record['@version']) : -1;
	var mode		= !parser.isNullOrUndefined(options.mode) ? parseInt(options.mode) : 0;
	var preserve	= !parser.isNullOrUndefined(options.preserve) ? parseInt(options.preserve) : 0;

	function onUpdate(error, results) {
		if(error) {
			return callback(error);
		}

		if(results) {
			for(var k in record) {
				results[k]	= record[k];
			}

			record	= results;
		}

		var content	= parser.encodeRecordData(record);
		var data	= {
			clusterId: rid.clusterId,
			clusterPosition: rid.clusterPosition,
			content: content,
			type: type,
			version: version,
			mode: mode
		};

		self.server.send(OperationTypes.REQUEST_RECORD_UPDATE, data, function(error, results){
			if(error) {
				return callback(error);
			}

			//Update record params
			delete record['@options'];
			record['@version']	= results.version;
			record['@class']	= self.getClusterById(rid.clusterId).name;

			callback(null, record);
		});
	}

	if(preserve) {
		self.recordLoad(rid, onUpdate)
	} else {
		onUpdate();
	}
};

Db.prototype.recordDelete = function(record, callback) {
	callback	= callback || EMPTY_FUNCTION;
	record		= record || {};

	var rid;

	if(_.isObject(record)) {
		rid	= parser.parseRid(record['@rid']);
	} else {
		rid	= parser.parseRid(record);
	}

	if(!rid.recordId) {
		return callback(new Error('OrientDB: Record Delete: Record ID is invalid.'))
	}

	var options	= record['@options'] || {};
	var version	= !parser.isNullOrUndefined(record['@version']) ? parseInt(record['@version']) : -1;
	var mode	= !parser.isNullOrUndefined(options.mode) ? parseInt(options.mode) : 0;

	var data	= {
		clusterId:rid.clusterId,
		clusterPosition: rid.clusterPosition,
		version:version,
		mode:mode
	};

	this.server.send(OperationTypes.REQUEST_RECORD_DELETE, data, callback);
};

Db.prototype.recordMetadata = function(record, callback) {
	var self	= this;
	callback	= callback || EMPTY_FUNCTION;

	if(OperationTypes.SERVER_PROTOCOL_VERSION < 14) {
		return callback(new Error('OrientDB: Record Metadata: This functionality is is only available in protocol 14 and above. This protocol is available starting with OrientDB 1.4.'))
	}

	var rid	= parser.parseRid(record);

	if(!rid.recordId) {
		return callback(new Error('OrientDB: Record Metadata: Record ID is invalid.'))
	}

	var data	= {
		clusterId:rid.clusterId,
		clusterPosition:rid.clusterPosition
	};

	self.server.send(OperationTypes.REQUEST_RECORD_METADATA, data, function(error, results) {
		if(error) {
			return callback(error);
		}

		var record	= {};
		record['@rid']		= rid.recordId;
		record['@type']		= 'd';
		record['@version']	= results.version;
		var clazz			= self.getClusterById(rid.clusterId).name;

		if(clazz) {
			record['@class']	= clazz;
		}

		callback(null, record);
	});
};

Db.prototype.positionsHigher	= makePositionFunc(OperationTypes.REQUEST_POSITIONS_HIGHER);
Db.prototype.positionsLower		= makePositionFunc(OperationTypes.REQUEST_POSITIONS_LOWER);
Db.prototype.positionsCeiling	= makePositionFunc(OperationTypes.REQUEST_POSITIONS_CEILING);
Db.prototype.positionsFloor		= makePositionFunc(OperationTypes.REQUEST_POSITIONS_FLOOR);

function makePositionFunc(operation) {
	return function(record, callback) {
		callback	= callback || EMPTY_FUNCTION;

		if (OperationTypes.SERVER_PROTOCOL_VERSION < 13) {
			return callback(new Error('OrientDB: This method is currently available with OrientDB 1.3+'));
		}

		var rid	= parser.parseRid(record);

		if(!rid.recordId) {
			return callback(new Error('OrientDB: Record Positions: Record ID is invalid.'))
		}

		var data	= {
			clusterId:rid.clusterId,
			clusterPosition:rid.clusterPosition
		};

		this.server.send(operation, data, function(error, results) {
			if(error) {
				return callback(error);
			}

			callback(null, results);
		});
	};
}

Db.prototype.recordCleanOut = function(record, callback) {
	callback	= callback || EMPTY_FUNCTION;

	if (OperationTypes.SERVER_PROTOCOL_VERSION < 13) {
		return callback(new Error('OrientDB: This method is currently available with OrientDB 1.3+'));
	}

	var rid	= parser.parseRid(record);

	if(!rid.recordId) {
		return callback(new Error('OrientDB: Record Metadata: Record ID is invalid.'))
	}

	var version	= !parser.isNullOrUndefined(record['@version']) ? parseInt(record['@version']) : -1;
	var options	= record['@options'] || {};
	var mode	= options.mode ? parseInt(options.mode) : 0;

	var data	= {
		clusterId:rid.clusterId,
		clusterPosition:rid.clusterPosition,
		version:version,
		mode:mode
	};

	this.server.send(OperationTypes.REQUEST_RECORD_CLEAN_OUT, data, function(error, results) {
		if(error) {
			return callback(error);
		}

		callback(null, results);
	});
}

/* Data Cluster */
Db.prototype.dataClusterAdd	= function(cluster, callback) {
    callback	= callback || EMPTY_FUNCTION;
	cluster		= cluster || {};

	var data	= {};
	data.type	= cluster.type ? cluster.type.toLowerCase() : 'physical';

	switch(data.type) {
        case 'physical':
        case 'memory':
            break;
        default:
            data.type	= 'memory';
    }

    data.name	= cluster.name;

    if(data.type === 'physical') {
        data.location	= cluster.location || '';
    }

	data.clusterId			= cluster.clusterId || -1;
	data.dataSegmentName	= cluster.dataSegmentName || null;

    this.server.send(OperationTypes.REQUEST_DATACLUSTER_ADD, data, function(error, results) {
        if(error) {
        	return callback(error);
        }

		callback(null, results);
    });
};

Db.prototype.dataClusterDrop = function(clusterId, callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
		clusterId: parseInt(clusterId)
    };

    this.server.send(OperationTypes.REQUEST_DATACLUSTER_DROP, data, callback);
};

Db.prototype.dataClusterCount = function(clusterIds, loadTombstones, callback) {
	if (_.isFunction(loadTombstones)) {
		callback		= loadTombstones;
		loadTombstones	= 0;
	} else {
		loadTombstones	= loadTombstones || 0;
	}

	callback = callback || EMPTY_FUNCTION;

	if(!_.isArray(clusterIds)) {
		clusterIds	= [clusterIds];
	}

    var data = {
        clusterIds:clusterIds,
		loadTombstones:loadTombstones
    };

    this.server.send(OperationTypes.REQUEST_DATACLUSTER_COUNT, data, callback);
};

Db.prototype.dataClusterDataRange = function(clusterId, callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
        clusterId: parseInt(clusterId)
    };

    this.server.send(OperationTypes.REQUEST_DATACLUSTER_DATARANGE, data, callback);
};

/*
Db.prototype.dataClusterCopy = function(clusterId, callback) {
    callback = callback || EMPTY_FUNCTION;

    var data = {
        clusterId: clusterId
    };

    this.server.send(OperationTypes.REQUEST_DATACLUSTER_COPY, data, callback);
};
*/

/*
Db.prototype.isLHClustersUsed = function(callback) {
    callback = callback || EMPTY_FUNCTION;

    // older versions do not support this command
    if (OperationTypes.SERVER_PROTOCOL_VERSION < 13) {
        return callback(new Error('OrientDB: isLHClustersUsed available since OrientDB 1.3'));
    }

    this.server.send(OperationTypes.REQUEST_DATACLUSTER_LH_CLUSTER_IS_USED, null, callback);
};
*/

/* Data Segment */
Db.prototype.dataSegmentAdd = function(segmentName, segmentLocation, callback) {
    callback		= callback || EMPTY_FUNCTION;
	segmentName		= segmentName || '';
	segmentLocation	= segmentLocation || '';

	var data = {
        segmentName: segmentName,
        segmentLocation: segmentLocation
    };

    var self = this;

    self.server.send(OperationTypes.REQUEST_DATASEGMENT_ADD, data, function(error, results) {
        if(error) {
			return callback(error);
		}

		self.reload(function(error) {
            if(error) {
				return callback(error);
			}

            callback(null, results);
        });
    });
};

Db.prototype.dataSegmentDrop = function(segmentName, callback) {
    callback = callback || EMPTY_FUNCTION;

    var self = this;

    self.server.send(OperationTypes.REQUEST_DATASEGMENT_DROP, segmentName, function(error, results) {
        if(error) {
			return callback(error);
		}

		if(results && results.status) {
            self.reload(function(error) {
                if(error) {
					return callback(error);
				}

                callback(null, results);
            });
        } else {
            callback(null, results);
        }
    });
};


/* Utils */
function recursivelyAccumulateORIDsTuples(document, tuples) {
    for (var field in document) {
        var fieldValue = document[field];
        if (_.isArray(fieldValue)) {
            for (var idx = 0, length = fieldValue.length; idx < length; idx++) {
                recursivelyAccumulateORIDsTuples(fieldValue[idx], tuples);
            }
        } else if (_.isPlainObject(fieldValue) && !parser.isNullOrUndefined(fieldValue["@class"])) {
            if (fieldValue["@class"] === "ORIDs") {
                var tuple = { doc: document, field: field, value: fieldValue };
                tuples.push(tuple);
            } else {
                recursivelyAccumulateORIDsTuples(fieldValue, tuples);
            }
        }
    }
}

function fromORIDTupleToRids(self, tuple, ridOfORID, size, rids, callback) {
    self.recordLoad(ridOfORID, function(error, ORID) {
        if(error) {
			return callback(error);
		}

        var treeNode = parser.deserializeORID(ORID);
        size = size || treeNode.treeSize;
        parser.pushArray(rids, treeNode.rids);

        if (rids.length === size) {
            callback(null, tuple, rids);
        }

        if (treeNode.leftRid) {
            fromORIDTupleToRids(self, tuple, treeNode.leftRid, size, rids, callback);
        }
        if (treeNode.rightRid) {
            fromORIDTupleToRids(self, tuple, treeNode.rightRid, size, rids, callback);
        }
    });
}

function toRidsFromORIDsOfDocument(self, document, callback) {
    if (parser.isNullOrUndefined(document) || document["@type"] !== "d") {
        return callback(null, document);
    }

    var oRIDsTuples = [];
    recursivelyAccumulateORIDsTuples(document, oRIDsTuples);

    if (oRIDsTuples.length === 0) {
        return callback(null, document);
    }

    var loadedTuples = 0;
    for (var idx = 0, length = oRIDsTuples.length; idx < length; idx++) {
        var tuple = oRIDsTuples[idx];
        fromORIDTupleToRids(self, tuple, tuple.value.root, 0, [], function(error, tuple, rids) {
            if(error) {
				return callback(error);
			}

            tuple.doc[tuple.field] = rids;
            loadedTuples++;

            if (loadedTuples === oRIDsTuples.length) {
                return callback(null, document);
            }
        });
    }
}

function toRidsFromORIDsOfDocuments(self, documents, callback) {
    if (documents.length === 0) {
        return callback(null, documents);
    }

    var done = 0;
    for (var idx = 0, length = documents.length; idx < length; idx++) {
        toRidsFromORIDsOfDocument(self, documents[idx], function(error, document) {
            if(error) {
				return callback(error);
			}

            done++;
            if (done === documents.length) {
                return callback(null, documents);
            }
        });
    }
}

function processResults(results) {
    var records = [];
    var content = results.content;

    switch (results.status) {
        case 97: // 'a'
            content["@type"] = "f";
            records.push(content);
            break;

        case 1:
        case 108: // 'l'
        case 114: // 'r'
            for (var idx = 0, length = content.length; idx < length; idx++) {
                records.push(processResult(content[idx], results.subcontents));
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
            } else {
                record = parser.deserializeDocument(content.content.toString());
            }

            record['@type']	= 'd';

            if (!parser.isNullOrUndefined(content.version)) {
                record['@version']	= content.version;
            }

            record['@rid']	= content.rid;

            if (subcontents) {
                var subRecords = [];
                for (var idx = 0, length = subcontents.length; idx < length; idx++) {
                    var subRecord = processResult(subcontents[idx]);
                    subRecords.push(subRecord);
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
            var subRecord = _.find(subRecords, function(record) {
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
    } else if (_.isPlainObject(obj)) {
        for (var field in obj) {
            if (field[0] !== "@") {
                collectRIDsIn(obj[field], accumulator, obj, field);
            }
        }
    } else if (parser.canParseRid(obj)) {
        accumulator.push({ rid: obj, container: container, key: key });
    }
}

Db.prototype.cascadingSave = function(masterDocument, transaction, callback) {
    if (_.isFunction(transaction)) {
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
                } else {
                    currentPath = field;
                }
                if (_.isArray(fieldValue)) {
                    for (var idx = 0, length = fieldValue.length; idx < length; idx++) {
                        var currentPathWithIdx = currentPath.concat(".", idx);
                        recursivelyFindObjectsWithClass(fieldValue[idx], currentPathWithIdx, pathsAccumulator);
                    }
                } else if (_.isPlainObject(fieldValue)) {
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
        self._saveRecord(document, function(error, savedDocument) {
            if(error) {
				return callback(error);
			}

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

        for (var idx = orderedPaths.length - 2; idx >= 0; idx--) {
            replaceElementAtPath(savedMasterDocument, orderedPaths[idx].split("."), orderedSavedDocs[idx]);
        }
        return savedMasterDocument;
    }

    var orderedSavedDocs = [];
    saveDocumentsByPaths(masterDocument, orderedPaths.slice(0), orderedSavedDocs, function(error) {
        if(error) {
			return callback(error);
		}

        var newMasterDocument = rebuildMasterDocumentFromSavedDocuments(orderedPaths, orderedSavedDocs);

        callback(null, newMasterDocument);
    });
};

Db.prototype.classCreate = function(classData, callback) {
	var self	= this;
	callback	= callback || EMPTY_FUNCTION;
	var className, classSuper;

	if(_.isObject(classData)) {
		className	= classData.name || '';
		classSuper	= classData.super || '';
	} else {
		className	= classData || '';
		classSuper	= '';
	}

    function onClassCreate(className, clusterId, callback) {
        var createCommand	= 'CREATE CLASS '.concat(className);

		if(classSuper !== '') {
			createCommand	= createCommand.concat(' extends ').concat(classSuper);
        }

		createCommand	= createCommand.concat(' cluster ').concat(clusterId);

        self.query(createCommand, function(error) {
            if(error) {
				return callback(error);
			}

			self.reload(function(error, clusters) {
                if(error) {
					return callback(error);
				}

				var results	= {};
				results.clusterId	= clusterId;
				results.class		= className;

                callback(null, results);
            });
        });
    }

    var cluster	= self.getClusterByName(className);

	if (parser.isNullOrUndefined(cluster)) {
		var dataSegment	= self.getDataSegmentById(cluster.dataSegmentId);

        var clusterOptions = {
            type: cluster.type,
            name: className,
            dataSegmentName: (dataSegment !== null ? dataSegment.dataName : 'internal')
        };

        self.dataClusterAdd(clusterOptions, function(error, results) {
            if(error) {
				return callback(error);
			}

			onClassCreate(className, results.clusterId, callback);
        });
    } else {
		onClassCreate(className, cluster.id, callback);
    }
};

Db.prototype.classDrop = function(classData, callback) {
	var self	= this;
    callback	= callback || EMPTY_FUNCTION;
	var className;

	if(_.isObject(classData)) {
		className	= classData.name || '';
	} else {
		className	= classData || '';
	}

    self.query('DROP CLASS ' + className, function(error) {
        if(error) {
			return callback(error);
		}

        self.reload(function(error) {
            if(error) {
				return callback(error);
			}

			var results	= {'status':1};
            callback(null, results);
        });
    });
};

Db.prototype.countRecordsInCluster = function(clusterName, callback) {
    callback = callback || EMPTY_FUNCTION;

    this.server.send(OperationTypes.COUNT, clusterName, function(error, results) {
        if(error) {
			return callback(error);
		}

		results = results || {};
        callback(null, results.count);
    });
};

Db.prototype.begin = function() {
    var transaction = {
        id: this.transactionId,
        clusterPosition: -1,
        actions: [],
        docs: []
    };

    this.transactionId++;

    return transaction;
};

Db.prototype.rollback = function(transaction) {
    for (var key in transaction) {
        delete transaction[key]
    }
};

Db.prototype.commit = function(transaction, callback) {
    if (parser.isNullOrUndefined(transaction.id) || parser.isNullOrUndefined(transaction.clusterPosition) || parser.isNullOrUndefined(transaction.actions) || transaction.actions.length === 0) {
        return callback(new Error('OrientDB: Invalid transaction: ' + JSON.stringify(transaction)));
    }

    callback	= callback || EMPTY_FUNCTION;

    this.server.send(OperationTypes.REQUEST_TX_COMMIT, transaction, function(error, txResult) {
        if(error) {
			return callback(error);
		}

        function recordCreatedToRID(recordCreated) {
            return parser.toRid(recordCreated.fromClusterId, recordCreated.fromClusterPosition);
        }

        function recordUpdatedToRID(recordUpdated) {
            return parser.toRid(recordUpdated.clusterId, recordUpdated.clusterPosition);
        }

        function lookupDoc(recordCreatedOrUpdated, toRIDFunction, callback) {
            var rid = toRIDFunction(recordCreatedOrUpdated);
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
            lookupDoc(recordCreated, recordCreatedToRID, function(error, recordCreated, doc) {
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
            lookupDoc(recordUpdated, recordUpdatedToRID, function(error, recordUpdated, doc) {
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

        callback(null, txResult);
    });
};

Db.prototype.getClusterByName = function(clusterName) {
	clusterName	= clusterName.toLowerCase();

	for(var g=0; g<this.clusters.length; g++) {
		if(this.clusters[g].name === clusterName) {
			return this.clusters[g];
		}
	}

	return null;
};

Db.prototype.getClusterById	= function(clusterId) {
	for (var idx = 0, length = this.clusters.length; idx < length; idx++) {
		if (this.clusters[idx].id === clusterId) {
			return this.clusters[idx];
		}
	}

	return null;
};

Db.prototype.getDataSegmentById = function(dataSegmentId) {
	for (var g=0; g<this.clusters.length; g++) {
		if(this.clusters[g].dataSegmentId === dataSegmentId) {
			return this.clusters[g];
		}
	}

	return null;
};

Db.prototype.getClassByName = function(className) {
	for (var idx = 0, length = this.classes.length; idx < length; idx++) {
		if (this.classes[idx].name === className || this.classes[idx].shortName === className) {
			return this.classes[idx];
		}
	}

	return null;
};

function loadDbSchema(self, callback) {
	callback = callback || EMPTY_FUNCTION;

	self.recordLoad('#0:0', function(error, results) {
		if (error) {
			return callback(error);
		}

		self.configuration	= parser.parseConfiguration(results.data.toString());

		self.recordLoad(self.configuration.schemaRecordId, {fetchPlan: '*:-1 index:0'}, function(error, results) {
			if (error) {
				return callback(error);
			}

			self.schema		= results.schema;
			self.classes	= results.classes;

			// only now call the open callback
			callback();
        });
    });
}