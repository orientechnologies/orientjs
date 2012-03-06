var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var Shutdown = module.exports = function Shutdown() {
};


Shutdown.prototype.read = function(data, callback) {
	  var self = this;

  	// status
    var status = data.readUInt8(0);
    if (status) {
        callback(data);
        return;
    }

    callback();
};


Shutdown.prototype.write = function(socket, sessionId, data, callback) {
    // operation type
    socket.write(parser.writeByte(OperationTypes.SHUTDOWN, true));
	
    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));

    // user name
    socket.write(parser.writeString(data.user_name));
    // user password
    socket.write(parser.writeString(data.user_password));
};

