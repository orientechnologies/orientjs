var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var RecordDelete = module.exports = function RecordDelete() {
};


RecordDelete.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var result = {};

    // payload status (always 1)
    result.status = parser.readByte(data, 5);
    
    callback(undefined, result);
};


RecordDelete.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.RECORD_DELETE, true));
	
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

