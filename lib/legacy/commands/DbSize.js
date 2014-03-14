"use strict";

var util			= require("util"),
    base			= require("./CommandBase"),
    parser			= require("../connection/parser"),
    OperationTypes	= require("./operation_types"),

    command = function() {
        base.call(this);
        this.steps.push(readSize);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DB_SIZE;


// TODO after a REQUEST_DB_CREATE the server does not return a size in REQUEST_DB_SIZE
// TODO this will cause problems if a REQUEST_DB_SIZE command comes concatenated with another command
/*if (buf.length !== 13) {
 callback(new Error("Could not retrieve the database size. This happens, for example, when you just created the database."));
 return;
 }*/
function readSize(buf, offset) {
    if (!parser.canReadLong(buf, offset)) {
		this.result	= 0;
        return 0;
    }

	this.result = parser.readLong(buf, offset);
    this.step++;
    return parser.BYTES_LONG;
}

command.write = function(socket, sessionId, data, callback) {
	this.result	= 0;

    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback imidiately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));
};

