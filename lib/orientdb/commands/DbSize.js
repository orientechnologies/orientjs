var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");

var DbSize = module.exports = function DbSize() {
};


DbSize.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var	result = {};

    // TODO after a DB_CREATE the server does not return a size in DB_SIZE
    if (data.length != 13) {
        callback("Could not retrieve the database size. This happens, for example, when you just created the database.");
        return;
    }

    // size
    result.size = parser.readLong(data, 5);

	callback(undefined, result);
};


DbSize.prototype.write = function(socket, sessionId, data, callback) {
debugger;
    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_SIZE, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
};

