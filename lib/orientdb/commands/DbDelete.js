var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var DbDelete = module.exports = function DbDelete() {
};


DbDelete.prototype.read = function(data, callback) {
	var self = this;

    var	result = {
	}

    // status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
    }

    // TODO in the spec this command should return a byte
    //      Why is this necessary btw? Anyway it' missing from response!
    // result
    //result.result = data.readUInt8(5);

    //if (result.result) {
	//    callback(undefined, result);
    //} else {
    //    callback("Could not delete database");
    //}
    //return;

    callback(null, result);
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

