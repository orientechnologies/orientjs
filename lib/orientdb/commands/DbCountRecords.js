var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbCountrecords = module.exports = function DbCountRecords() {
};


DbCountrecords.prototype.read = function(data, callback) {
	var self = this;

    var	result = {
	}

    // status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
    }

    // count
    result.count = data.readUInt32BE(5) * 256 + data.readUInt32BE(9);

	callback(null, result);
};


DbCountrecords.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_COUNTRECORDS, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
};

