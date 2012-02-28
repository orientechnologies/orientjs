var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");

var DbSize = module.exports = function DbSize() {
};


DbSize.prototype.read = function(data, callback) {
	var self = this;

    var	result = {
	}

    // status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
    }

    // TODO after a DB_CREATE the server does not return a size in DB_SIZE
    if (data.length != 13) {
        callback("Could not retrieve the database size. This happens, for example, when you just created the database.");
        return;
    }

    // size
    result.size = data.readUInt32BE(5) * 256 + data.readUInt32BE(9);

	callback(null, result);
};


DbSize.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_SIZE, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
};

