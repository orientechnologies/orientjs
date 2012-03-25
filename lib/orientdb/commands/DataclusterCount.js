var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DataclusterCount = module.exports = function DataclusterCount() {
};


DataclusterCount.prototype.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // status
    var status = parser.readByte(buf, offset);
    if (status) {
        callback (buf);
        return;
    }
    offset += 1;

    // skip the session ID
    offset += 4;

    var result = {};

    // cluster count
    result.clusterCount = parser.readLong(buf, offset);
    offset += 8;

    data.index = offset;

    callback(undefined, result);
};


DataclusterCount.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DATACLUSTER_COUNT, true));

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

