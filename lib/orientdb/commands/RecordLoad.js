var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var RecordLoad = module.exports = function RecordLoad() {
};


RecordLoad.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var result = {};

    var offset = 5;

    // TODO why is this the position in the cluster?
    // position in the cluster of the new record
    result.status = parser.readByte(data, 5);
    if (result.status == 0) {
        callback(undefined, result);
        return;
    }
    offset += 1;

    // record content
    result.content = parser.readBytes(data, offset);
    offset += 4 + result.content.length;

    // record version
    result.version = parser.readInt(data, offset);
    offset += 4;

    // record type
    result.type = String.fromCharCode(parser.readByte(data, offset));
    offset += 1;

    // TODO what is this?
    //parser.readByte(data, offset + 5);

    callback(undefined, result);
};


RecordLoad.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.RECORD_LOAD, true));
	
    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // cluster ID
    socket.write(parser.writeShort(data.clusterId));
    // cluster position
    socket.write(parser.writeLong(data.clusterPosition));

    // fetch plan
    socket.write(parser.writeString(data.fetchPlan));

    // this will go with rc9
    // ignore cache
    // socket.write(parser.writeByte(data.ignoreCache, true));
};

