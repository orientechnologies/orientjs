var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DataClusterAdd = module.exports = function DataClusterAdd() {
};


DataClusterAdd.prototype.read = function(data, callback) {
    // status
    var status = data.readUInt8(0);
    if (status) {
        callback(data);
        return;
    }

    var	result = {};
    
    // cluster number
    result.number = data.readInt16BE(0);
    
    callback(null, result);
};


DataClusterAdd.prototype.write = function(socket, sessionId, data, callback) {
    // operation type
    socket.write(parser.writeByte(OperationTypes.DATACLUSTER_ADD, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
    
    // cluster type and name
    socket.write(parser.writeString(data.type));
    socket.write(parser.writeString(data.name));
    
    // filename and size
    if (data.type === "PHYSICAL") {
      socket.write(parser.writeString(data.file_name));
      socket.write(parser.writeInt(data.initial_size));
    } else if (data.type === "LOGICAL") {
      socket.write(parser.writeInt(data.physical_cluster_container_id));
    }
};

