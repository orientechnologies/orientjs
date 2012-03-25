var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var RecordUpdate = module.exports = function RecordUpdate() {
};


RecordUpdate.prototype.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // status
    var status = parser.readByte(buf, offset);
    if (status) {
        callback (buf);
        return;
    }
    offset += 1;

    // skip the session ID
    offset += 4;

    var result = {};

    // position in the cluster of the new record
    result.version = parser.readInt(buf, offset);
    offset += 4;

    data.index = offset;

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

