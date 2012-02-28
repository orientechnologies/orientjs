var parser = require("../connection/parser"),
	OPERATIONTYPE = require("./operation_types");
	
/*------------------------------------------------------------------------------
  (public) DbOpen
  
  + none
  - void
  
  Constructor - set up parser.
------------------------------------------------------------------------------*/
var DbOpen = module.exports = function DbOpen() {
	this._indexCursor = 13;
};

/*------------------------------------------------------------------------------
  (public) read
  
  + data
  + callback
  - void
  
  Read respone from server and emits response event.
------------------------------------------------------------------------------*/
DbOpen.prototype.read = function(data, callback) {
	var self = this,
		indexCursor = this._indexCursor,
		result = {
			sessionId: 0,
			clustersCount: 0,
			clusters: [],
			clusterConfig: null
		},
		cluster = {},
		i, j, tempInt;

	// status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
	}

    // session ID
    result.sessionId = data.readUInt32BE(5);

    // number of clusters
    result.clustersCount = data.readUInt16BE(9);

    // clusters
    for (i = 0, indexCursor = 11; i < result.clustersCount; i++) {
        // cluster name
        cluster["name"] = parser.readString(data, indexCursor);
        indexCursor += cluster.name.length + 4;

        // cluster id
        cluster["id"] = data.readUInt16BE(indexCursor);
        indexCursor += 2;

        // cluster type
        cluster["type"] = parser.readString(data, indexCursor);
        indexCursor += cluster.type.length + 4;

        // insert cluster into collection
        result.clusters.push(cluster);
        // clear cluster object
        cluster = {};
	}
	
	callback(undefined, result);
};

/*------------------------------------------------------------------------------
  (public) write
  
  + socket
  + sessionId
  + data
  + callback
  - void
  
  Write request to server and emits request event.

Request:  (driver-name:string)(driver-version:string)(protocol-version:short)(client-id:string)(database-name:string)(database-type:string)(user-name:string)(user-password:string)
Response: (session-id:int)(num-of-clusters:short)[(cluster-name:string)(cluster-id:short)(cluster-type:string)](cluster-config:bytes)
------------------------------------------------------------------------------*/
DbOpen.prototype.write = function(socket, sessionId, data, callback) {
	var buffer;

	// operation type
	socket.write(parser.writeByte(OPERATIONTYPE.DB_OPEN, true));
	//socket.write(parser.writeByte(500, true));
	
	// invoke callback imidiately when the operation is sent to the server
	callback();
	
	// session ID
	socket.write(parser.writeInt(sessionId, true));

    // driver name
    socket.write(parser.writeString("OrientDB Node.js driver"));
    // driver version
    socket.write(parser.writeString("0.0.1"));
    // protocol version
    socket.write(parser.writeShort(7));
    // client id
    socket.write(parser.writeString(""));
    // database name
	socket.write(parser.writeString(data.database_name));
    // database type
    // TODO starting with protocol version 8
	//socket.write(parser.writeString("graph"));
    // user name
	socket.write(parser.writeString(data.user_name));
    // user password
	socket.write(parser.writeString(data.user_password));
};

