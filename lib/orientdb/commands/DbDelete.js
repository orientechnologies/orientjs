var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    operation = module.exports.operation = OperationTypes.DB_DELETE;


module.exports.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1;

    // skip the session ID
    offset += 4;

    var	result = {};

    // TODO in the spec this command should return a byte
    //      Why is this necessary btw? Anyway it' missing from response!
    // result
    //result.result = parser.readByte(data, 5);

    //if (result.result) {
	//    callback(undefined, result);
    //} else {
    //    callback("Could not delete database");
    //}
    //return;

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

    // database name
    socket.write(parser.writeString(data.database_name));
};

