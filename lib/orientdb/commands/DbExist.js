var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbExist = module.exports = function DbExist() {
};


DbExist.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var	result = {};

    // result
    result.result = Boolean(parser.readByte(data, 5));

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

