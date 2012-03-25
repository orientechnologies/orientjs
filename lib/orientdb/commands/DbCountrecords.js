var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbCountrecords = module.exports = function DbCountRecords() {
};


DbCountrecords.prototype.read = function(data, callback) {

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

    var	result = {};

    // count
    result.count = parser.readLong(buf, offset);
    offset += 8;

    data.index = offset;

	callback(undefined, result);
};


DbCountrecords.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_COUNTRECORDS, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
};

