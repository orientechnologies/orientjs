"use strict";

var util			= require("util"),
    base			= require("./CommandBase"),
    parser			= require("../connection/parser"),
    OperationTypes	= require("./operation_types"),

    command = function() {
        base.call(this);
        this.steps.push(readResult);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DB_EXIST;

function readResult(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
        return 0;
    }
    this.result.result = Boolean(parser.readByte(buf, offset));
    this.step++;
    return parser.BYTES_BYTE;
}

command.write = function(socket, sessionId, data, callback) {
    // operation type
    socket.write(parser.writeByte(command.operation));

    // invoke callback immediately when the operation is sent to the server
    callback();
console.log('DBExist::sessionId', sessionId, data.serverStorageType)
    //Session ID
    socket.write(parser.writeInt(sessionId));

	//Database name
	socket.write(parser.writeString(data.databaseName));

	//Database storage type
	socket.write(parser.writeString(data.serverStorageType));
};