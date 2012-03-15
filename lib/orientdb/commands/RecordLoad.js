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

    // position in the cluster of the new record
    result.status = parser.readByte(data, 5);
    if (result.status == 0) {
      callback(undefined, result);
      return;
    }
    
    result.content = parser.readBytes(data, 6);

    var new_offset = 6 + 4 + result.content.length;
    result.version = parser.readInt(data, new_offset);

    result.recordType = parser.readByte(data, new_offset + 4);
    if (result.recordType === 100) {
      result.recordType = "d";
    } else if (result.recordType === 102) {
      result.recordType = "f";
    } else {
      result.recordType = "b";
    }
    parser.readByte(data, new_offset + 5);
    
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

