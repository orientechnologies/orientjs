'use strict';

var util			= require("util"),
	base			= require("./CommandBase"),
	parser			= require("../connection/parser"),
	_				= require("lodash"),
	OperationTypes	= require("./operation_types"),

	command = function() {
		base.call(this);

		this.steps.push(readRecordRID);
		this.steps.push(readRecordVersion);
	};

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_RECORD_METADATA;

function readRecordRID(buf, offset) {
	if (!parser.canReadShort(buf, offset)) {
		return 0;
	}
	if (!parser.canReadLong(buf, offset + parser.BYTES_SHORT)) {
		return 0;
	}

	this.result.rid = parser.toRid(parser.readShort(buf, offset), parser.readLong(buf, offset + parser.BYTES_SHORT));
	this.step++;
	return parser.BYTES_SHORT + parser.BYTES_LONG;
}

function readRecordVersion(buf, offset) {
	if (!parser.canReadInt(buf, offset)) {
		return 0;
	}

	this.result.version = parser.readInt(buf, offset);
	this.step++;
	return parser.BYTES_INT;
}

function readRecordType(buf, offset) {
	if (!parser.canReadByte(buf, offset)) {
		return 0;
	}
	this.result.type = String.fromCharCode(parser.readByte(buf, offset));
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
};