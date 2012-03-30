var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    operation = module.exports.operation = OperationTypes.DB_RELOAD;


module.exports.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1

    // skip the session ID
    offset += 4;

    // number of clusters
    var clusterCount = parser.readShort(buf, offset);
    offset += 2;

    var clusters = [];

    // clusters
    for (var i = 0; i < clusterCount; i++) {
        var cluster = {};

        // cluster name
        cluster.name = parser.readString(buf, offset);
        offset += cluster.name.length + 4;

        // cluster id
        cluster.id = parser.readShort(buf, offset);
        offset += 2;

        // cluster type
        cluster.type = parser.readString(buf, offset);
        offset += cluster.type.length + 4;

        // insert cluster into collection
        clusters.push(cluster);
    }
    
    data.index = offset;
    var result = {
        clusters: clusters
    }

    callback(undefined, result);
};


module.exports.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(operation, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
};

