var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    operation = module.exports.operation = OperationTypes.RECORD_DELETE;


module.exports.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1

    // skip the session ID
    offset += 4;

    var result = {};

    // payload status (always 1)
    result.status = parser.readByte(buf, offset);
    offset += 1;

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

    // cluster ID
    socket.write(parser.writeShort(data.clusterId));
    // cluster position
    socket.write(parser.writeLong(data.clusterPosition));
    // record version
    socket.write(parser.writeInt(data.version));
    // mode
    socket.write(parser.writeByte(data.mode, true));
};

