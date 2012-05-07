var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    operation = module.exports.operation = OperationTypes.DB_CLOSE;


module.exports.read = function(data, callback) {
    //no data is sent to the client on db close
};


module.exports.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(operation, true));

    // session ID
    socket.write(parser.writeInt(sessionId, true));

    // call it at the END or other functions may too soon send data over the wire
    callback();
};

