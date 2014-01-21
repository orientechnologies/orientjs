'use strict';

var util			= require("util"),
	base			= require("./CommandBase"),
	parser			= require("../connection/parser"),
	_				= require("lodash"),
	OperationTypes	= require("./operation_types"),

	command = function() {
		base.call(this);

		this.steps.push(readStatus);
	};

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_RECORD_CLEAN_OUT;

function readStatus(buf, offset) {
	if (!parser.canReadByte(buf, offset)) {
		return 0;
	}
	this.result.status = parser.readByte(buf, offset);
	this.step++;
	return parser.BYTES_BYTE;
}

command.write = function(socket, sessionId, data, callback, manager) {
	//Operation type
	socket.write(parser.writeByte(this.operation));

	//Invoke callback immediately when the operation is sent to the server
	callback();

	//Session ID
	socket.write(parser.writeInt(sessionId));

	//Cluster ID
	socket.write(parser.writeShort(data.clusterId));
	//Cluster position
	socket.write(parser.writeLong(data.clusterPosition));
	//Record version
	socket.write(parser.writeInt(data.version));
	//Mode
	socket.write(parser.writeByte(data.mode));
};