var parser = require("../connection/parser"),
    debug = require("../connection/debug"),
    OperationTypes = require("./operation_types");


var RecordLoad = module.exports = function RecordLoad() {
};


RecordLoad.prototype.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1

    // skip the session ID
    offset += 4;

    var result = {};

    // TODO read in a loop since the result can contain multiple records
    // or is this a hoax in the binary protocol specification?

    // payload status
    result.status = parser.readByte(buf, offset);
    if (result.status == 0) {
        callback(undefined, result);
        return;
    }
    offset += 1;

    // record content
    result.content = parser.readBytes(buf, offset);
    offset += 4 + result.content.length;

    // record version
    result.version = parser.readInt(buf, offset);
    offset += 4;

    // record type
    result.type = String.fromCharCode(parser.readByte(buf, offset));
    offset += 1;

    // read one more status byte that should say 0
    // TODO if not zero, we should behave acordingly (read one more record)
    parser.readByte(buf, offset);
    offset += 1;

    data.index = offset;

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
    socket.write(parser.writeShort(data.cluster_id));
    // cluster position
    socket.write(parser.writeLong(data.cluster_position));

    // fetch plan
    socket.write(parser.writeString(data.fetch_plan));

    // TODO this will go with rc9
    // ignore cache
    // socket.write(parser.writeByte(data.ignore_cache, true));
};

