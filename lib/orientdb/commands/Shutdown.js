var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    operation = module.exports.operation = OperationTypes.SHUTDOWN;


module.exports.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1

    // skip the session ID
    offset += 4;

    var result = {};

    data.index = offset;

    callback(undefined, result);
};


module.exports.write = function(socket, sessionId, data, callback) {
    // operation type
    socket.write(parser.writeByte(operation, true));
	
    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));

    // user name
    socket.write(parser.writeString(data.user_name));
    // user password
    socket.write(parser.writeString(data.user_password));
};

