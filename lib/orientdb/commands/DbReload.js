var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbReload = module.exports = function DbReload() {
};


DbReload.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    // number of clusters
    var clusterCount = parser.readShort(data, 5);

    var clusters = [];
    // clusters
    for (var i = 0, indexCursor = 7; i < clusterCount; i++) {
        var cluster = {};

        // cluster name
        cluster.name = parser.readString(data, indexCursor);
        indexCursor += cluster.name.length + 4;

        // cluster id
        cluster.id = parser.readShort(data, indexCursor);
        indexCursor += 2;

        // cluster type
        cluster.type = parser.readString(data, indexCursor);
        indexCursor += cluster.type.length + 4;

        // insert cluster into collection
        clusters.push(cluster);
    }
    
    var result = {
        clusters: clusters
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

