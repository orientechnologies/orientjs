var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbClose = module.exports = function DbClose() {
};


DbClose.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var	result = {};

	callback(undefined, result);
};


DbClose.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_CLOSE, true));
	
    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
};

