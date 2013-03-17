"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.DB_RELEASE;

command.write = function(socket, sessionId, databaseName, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation));

    // session ID
    socket.write(parser.writeInt(sessionId));

    // call it at the END or other functions may too soon send data over the wire
    callback();

    // database name
    socket.write(parser.writeString(databaseName));
};

