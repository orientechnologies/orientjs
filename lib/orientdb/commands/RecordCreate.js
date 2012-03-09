var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var RecordCreate = module.exports = function RecordCreate() {
};


RecordCreate.prototype.read = function(data, callback) {
    
    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var result = {};

    // position in the cluster of the new record
    result.position = parser.readLong(data, 5);
    
    callback(undefined, result);
};


RecordCreate.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.RECORD_CREATE, true));
	
    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));
    
    // cluster ID
    socket.write(parser.writeShort(data.clusterId));
    
    // record data
    socket.write(parser.writeBytes(data.content));
    // record type
    socket.write(parser.writeByte(data.recordType, true));
    // mode
    socket.write(parser.writeByte(data.mode, true));
};

