"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readIsUsedByte);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.DATACLUSTER_LH_CLUSTER_IS_USED;

function readIsUsedByte(buf, offset) {
    if (!parser.canReadBoolean(buf, offset)) {
        return 0;
    }
    this.result = parser.readBoolean(buf, offset);
    this.step++;
    return parser.BYTES_BYTE;
}

command.write = function(socket, sessionId, segmentName, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

};
