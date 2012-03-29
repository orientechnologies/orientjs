var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DataclusterRemove = module.exports = function DataclusterRemove() {
};


DataclusterRemove.prototype.read = function(data, callback) {
    
    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1

    // skip the session ID
    offset += 4;

    var result = {};

    // result
    result.result = parser.readByte(buf, offset);
    offset += 1;

    data.index = offset;

    callback(undefined, result);
};


DataclusterRemove.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DATACLUSTER_REMOVE, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));
    
    // cluster number
    socket.write(parser.writeShort(data.cluster_number));
};

