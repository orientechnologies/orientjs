var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");

var DbSize = module.exports = function DbSize() {
};


DbSize.prototype.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1

    // skip the invalid/negative session ID
    offset += 4;

    var	result = {};

    // TODO after a DB_CREATE the server does not return a size in DB_SIZE
    // TODO this will cause problems if a DB_SIZE command comes concatenated with another command
    if (buf.length != 13) {
        callback("Could not retrieve the database size. This happens, for example, when you just created the database.");
        return;
    }

    // size
    result.size = parser.readLong(buf, offset);
    offset += 8;

    data.index = offset;

	callback(undefined, result);
};


DbSize.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_SIZE, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
};

