var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbReload = module.exports = function DbReload() {
};


DbReload.prototype.read = function(data, callback) {
	var self = this;

    var	result = {
        clusters: []
	};

    // status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
    }

    // number of clusters
    var clusterCount = data.readUInt32BE(5);

    // clusters
    for (var i = 0, indexCursor = 9; i < clusterCount; i++) {
        var cluster = {};

        // cluster name
        cluster["name"] = parser.readString(data, indexCursor);
        indexCursor += cluster.name.length + 4;

        // cluster id
        cluster["id"] = data.readUInt32BE(indexCursor);
        indexCursor += 4;

        // cluster type
        cluster["type"] = parser.readString(data, indexCursor);
        indexCursor += cluster.type.length + 4;

        // insert cluster into collection
        result.clusters.push(cluster);
	}

	callback(undefined, result);
};


DbReload.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_RELOAD, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
};

