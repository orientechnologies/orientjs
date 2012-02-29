var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbExist = module.exports = function DbExist() {
};


DbExist.prototype.read = function(data, callback) {
	var self = this;

    var	result = {
	}

    // status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
    }

    // result
    result.result = Boolean(data.readUInt8(5));

    callback(null, result);
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

