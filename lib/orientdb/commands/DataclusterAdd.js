var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),
    
    operation = module.exports.operation = OperationTypes.DATACLUSTER_ADD;


module.exports.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1;

    // skip the session ID
    offset += 4;

    var result = {};

    // cluster number
    result.number = parser.readShort(buf, offset);
    offset += 2;

    data.index = offset;

    callback(undefined, result);
};


module.exports.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(operation, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
    
    // cluster type
    socket.write(parser.writeString(data.type));

    // cluster  name
    socket.write(parser.writeString(data.name));
    
    // filename and size
    if (data.type === "PHYSICAL") {

        // file name
        socket.write(parser.writeString(data.file_name));

        // initial size
        socket.write(parser.writeInt(data.initial_size));

    } else if (data.type === "LOGICAL") {

        // physical cluster container ID
        socket.write(parser.writeInt(data.physical_cluster_container_id));
    }
};

