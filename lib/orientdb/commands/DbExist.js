var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbExist = module.exports = function DbExist() {
};


DbExist.prototype.read = function(data, callback) {

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

    // result
    result.result = Boolean(parser.readByte(buf, offset));
    offset += 1;

    data.index = offset;

    callback(undefined, result);
};


DbExist.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_EXIST, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));

    // database name
    socket.write(parser.writeString(data.database_name));
};

