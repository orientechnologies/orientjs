var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    operation = module.exports.operation = OperationTypes.DATACLUSTER_COUNT;


module.exports.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1

    // skip the session ID
    offset += 4;

    var result = {};

    // cluster count
    result.clusterCount = parser.readLong(buf, offset);
    offset += 8;

    data.index = offset;

    callback(undefined, result);
};


module.exports.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(operation, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // clusters list length
    socket.write(parser.writeShort(data.clustersId.length));

    // clusters ids
    for (var index in data.clustersId) {
        socket.write(parser.writeShort(data.clustersId[index]));
    }
};

