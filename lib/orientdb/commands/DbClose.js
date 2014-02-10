"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps = [];
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.REQUEST_DB_CLOSE;

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation));

    // session ID
    socket.write(parser.writeInt(sessionId));

    // call it at the END or other functions may too soon send data over the wire
    callback();
};

