var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readNumber);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.DATACLUSTER_ADD;

function readNumber(buf, offset) {
    if (!parser.canReadShort(buf, offset)) {
        return 0;
    }
    this.result.number = parser.readShort(buf, offset);
    this.step++;
    return parser.BYTES_SHORT;
}

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
    
    // cluster type
    socket.write(parser.writeString(data.type));

    // cluster  name
    socket.write(parser.writeString(data.name));
    
    // filename and size
    if (data.type === "PHYSICAL") {

        // file name
        socket.write(parser.writeString(data.file_name));

        // initial size
        socket.write(parser.writeInt(data.initial_size));

    } else if (data.type === "LOGICAL") {

        // physical cluster container ID
        socket.write(parser.writeInt(data.physical_cluster_container_id));
    }
};

