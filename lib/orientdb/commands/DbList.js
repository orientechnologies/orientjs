"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readDatabaseList);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.DB_LIST;

function readDatabaseList(buf, offset) {
    if (!parser.canReadBytes(buf, offset)) {
        return 0;
    }
    this.result.content = parser.readBytes(buf, offset);
    this.step++;
    return parser.BYTES_INT + this.result.content.length;
}

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation));

    // invoke callback immediately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));
};

