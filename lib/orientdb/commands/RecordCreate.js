"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readPosition);
        this.steps.push(readRecordVersion);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.RECORD_CREATE;

function readPosition(buf, offset) {
    if (!parser.canReadLong(buf, offset)) {
        return 0;
    }
    this.result.position = parser.readLong(buf, offset);
    this.step++;
    return parser.BYTES_LONG;
}

function readRecordVersion(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }
    this.result.version = parser.readInt(buf, offset);
    this.step++;
    return parser.BYTES_INT;
}

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation));

    // invoke callback immediately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // data Segment ID
    socket.write(parser.writeInt(data.dataSegmentId));

    // cluster ID
    socket.write(parser.writeShort(data.clusterId));

    // record data
    socket.write(parser.writeBytes(data.content));
    // record type
    socket.write(parser.writeByte(data.type));
    // mode
    socket.write(parser.writeByte(data.mode));
};

