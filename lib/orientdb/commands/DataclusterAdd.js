var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DataclusterAdd = module.exports = function DataclusterAdd() {
};


DataclusterAdd.prototype.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // status
    var status = parser.readByte(buf, offset);
    if (status) {
        callback(buf);
        return;
    }
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


DataclusterAdd.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DATACLUSTER_ADD, true));

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

