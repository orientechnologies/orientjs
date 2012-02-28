var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");


var Connect = module.exports = function Connect() {
};


Connect.prototype.read = function(data, callback) {
    var self = this;

    var result = {
        sessionId: 0
    };

    // status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
    }

    // session ID
    result.sessionId = data.readUInt32BE(5);

	callback(undefined, result);
};


Connect.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.CONNECT, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));

    // driver name
    socket.write(parser.writeString("OrientDB Node.js driver"));
    // driver version
    socket.write(parser.writeString("0.0.1"));
    // protocol version
    socket.write(parser.writeShort(7));
    // client id
    socket.write(parser.writeString(""));
    // user name
    socket.write(parser.writeString(data.user_name));
    // user password
    socket.write(parser.writeString(data.user_password));
};

