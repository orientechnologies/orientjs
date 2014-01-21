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
		return 0;
	}

	this.result.status = parser.readByte(buf, offset);

	return parser.BYTES_BYTE;
}

command.write		= function(socket, sessionId, data, callback) {
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

