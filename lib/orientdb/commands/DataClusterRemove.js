var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");

var DataClusterRemove = module.exports = function DataClusterRemove() {
};


DataClusterRemove.prototype.read = function(data, callback) {
    // status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
    }
    
    callback(undefined, {});
};


DataClusterRemove.prototype.write = function(socket, sessionId, data, callback) {
    // operation type
    socket.write(parser.writeByte(OperationTypes.DATACLUSTER_REMOVE, true));
	
    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));
    
    // cluster number
    socket.write(parser.writeShort(data.cluster_number));
};

