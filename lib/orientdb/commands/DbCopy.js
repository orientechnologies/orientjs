"use strict";

var util = require("util"),
	base = require("./CommandBase"),
	parser = require("../connection/parser"),
	OperationTypes = require("./operation_types"),

	command = function() {
		base.call(this);

		this.steps.push(readPayloadStatus);
	};

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DB_COPY;

function readPayloadStatus(buf, offset) {
	if(!parser.canReadByte(buf, offset)) {
		this.result	= false;
		return 0;
	}

	this.result	= parser.readByte(buf, offset) ? true : false;

	return parser.BYTES_BYTE;
}

command.write	= function(socket, sessionId, data, callback) {
	this.result	= false;

	//Operation type
	socket.write(parser.writeByte(command.operation));

	//Invoke callback immediately when the operation is sent to the server
	callback();

	//Session ID
	socket.write(parser.writeInt(sessionId));

	//Database name
	socket.write(parser.writeString(data.databaseUrl));
	//Database user
	socket.write(parser.writeString(data.databaseUser));
	//Database password
	socket.write(parser.writeString(data.databasePass));
	//Remote server name
	socket.write(parser.writeString(data.remoteServerName));
	//Remote server engine
	socket.write(parser.writeString(data.remoteServerEngine));
};

