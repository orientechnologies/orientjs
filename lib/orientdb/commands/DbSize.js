"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readSize);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.DB_SIZE;


// TODO after a DB_CREATE the server does not return a size in DB_SIZE
// TODO this will cause problems if a DB_SIZE command comes concatenated with another command
/*if (buf.length !== 13) {
 callback("Could not retrieve the database size. This happens, for example, when you just created the database.");
 return;
 }*/
function readSize(buf, offset) {
    if (!parser.canReadLong(buf, offset)) {
        return 0;
    }
    this.result.size = parser.readLong(buf, offset);
    this.step++;
    return parser.BYTES_LONG;
}

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));
};

