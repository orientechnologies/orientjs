"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DB_CREATE;
command.write		= function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation));

    // invoke callback immediately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // database name
    socket.write(parser.writeString(data.databaseName));

    // database type
    socket.write(parser.writeString(data.databaseType));

    // storage type
    socket.write(parser.writeString(data.storageType));
};

