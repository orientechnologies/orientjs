var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DataclusterCount = module.exports = function DataclusterCount() {
};


DataclusterCount.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var result = {};

    // clusters count
    result.clustersCount = parser.readLong(data, 5);

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
    for (index in data.clustersId) {
        socket.write(parser.writeShort(data.clustersId[index]));
    }
};

