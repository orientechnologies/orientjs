var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DataclusterDataRange = module.exports = function DataclusterDataRange() {
};


DataclusterDataRange.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var result = {};

    // clusters count
    result.begin = parser.readLong(data, 5);
    result.end = parser.readLong(data, 13);

    callback(undefined, result);
};


DataclusterDataRange.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DATACLUSTER_DATARANGE, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // cluster ID
    socket.write(parser.writeShort(data.clusterId));
};

