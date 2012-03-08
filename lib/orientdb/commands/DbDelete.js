var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbDelete = module.exports = function DbDelete() {
};


DbDelete.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

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

    callback(undefined, result);
};


DbDelete.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_DELETE, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));

    // database name
    socket.write(parser.writeString(data.database_name));
};

