var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readSessionId);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.CONNECT;

function readSessionId(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }
    this.result.sessionId = parser.readInt(buf, offset);
    this.step++;
    return parser.BYTES_INT;
}

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));

    // driver name
    socket.write(parser.writeString("OrientDB Node.js driver"));
    // driver version
    socket.write(parser.writeString("0.8.0"));
    // protocol version
    socket.write(parser.writeShort(12));
    // client id
    socket.write(parser.writeString(""));
    // user name
    socket.write(parser.writeString(data.user_name));
    // user password
    socket.write(parser.writeString(data.user_password));
};
