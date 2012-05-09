var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readByte);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.DATACLUSTER_REMOVE;

function readByte(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
        return 0;
    }
    this.result.result = parser.readByte(buf, offset);
    this.step++;
    return parser.BYTES_BYTE;
}

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // cluster number
    socket.write(parser.writeShort(data.cluster_number));
};

