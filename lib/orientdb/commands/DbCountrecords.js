var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbCountrecords = module.exports = function DbCountRecords() {
};


DbCountrecords.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var	result = {};

    // count
    result.count = parser.readLong(data, 5);

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

