var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var RecordUpdate = module.exports = function RecordUpdate() {
};


RecordUpdate.prototype.read = function(data, callback) {
    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var result = {};

    // position in the cluster of the new record
    result.version = parser.readInt(data, 5);
    
    callback(undefined, result);
};


RecordUpdate.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.RECORD_UPDATE, true));
	
    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));
    
    // cluster ID
    socket.write(parser.writeShort(data.clusterId));
    // cluster position
    socket.write(parser.writeLong(data.clusterPosition));

    // record data
    socket.write(parser.writeBytes(data.content));
    // record version
    socket.write(parser.writeInt(data.version));
    // record type
    socket.write(parser.writeByte(data.type, true));
    // mode
    socket.write(parser.writeByte(data.mode, true));
};

