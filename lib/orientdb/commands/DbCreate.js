var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbCreate = module.exports = function DbCreate() {
};


DbCreate.prototype.read = function(data, callback) {
	var self = this;

    var	result = {
	}

    // status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
    }

	callback(undefined, result);
};


DbCreate.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_CREATE, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));

    // database name
    socket.write(parser.writeString(data.database_name));

    // database type
    // TODO starting with protocol version 8
    //socket.write(parser.writeString(data.database_type));
    
    // storage type
    socket.write(parser.writeString(data.storage_type));
};

