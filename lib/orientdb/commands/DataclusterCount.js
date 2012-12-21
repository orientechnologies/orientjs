"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readClusterCount);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.DATACLUSTER_COUNT;

function readClusterCount(buf, offset) {
    if (!parser.canReadLong(buf, offset)) {
        return 0;
    }
    this.result.clusterCount = parser.readLong(buf, offset);
    this.step++;
    return parser.BYTES_LONG;
}

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // clusters array length
    socket.write(parser.writeShort(data.clustersId.length));

    // clusters ids
    for (var index in data.clustersId) {
        socket.write(parser.writeShort(data.clustersId[index]));
    }
};

