"use strict";

var util			= require("util"),
    debug			= require("../connection/debug"),
    packageInfo		= require("../../../package.json"),
    base			= require("./CommandBase"),
    parser			= require("../connection/parser"),
    OperationTypes	= require("./operation_types"),
	constants		= require("../constants.js"),

    command = function() {
        base.call(this);

        this.steps.push(readSessionId);
        this.steps.push(readClusters);
		this.steps.push(readClusterConfig);

		if(OperationTypes.SERVER_PROTOCOL_VERSION > 12) {
			this.steps.push(readOrientRelease);
		}
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DB_OPEN;

function readSessionId(buf, offset) {
	if (!parser.canReadInt(buf, offset)) {
        return 0;
    }
    this.result.sessionId = parser.readInt(buf, offset);
    this.step++;
    return parser.BYTES_INT;
}

function readClusters(buf, offset) {
	if (!parser.canReadShort(buf, offset)) {
        return 0;
    }

    var clusterCount = parser.readShort(buf, offset);
    var bytesRead = parser.BYTES_SHORT;

    var clusters = [];

    // clusters
    for(var idx = 0; idx < clusterCount; idx++) {
        var cluster = {};

        //Cluster name
        if (!parser.canReadString(buf, offset + bytesRead)) {
            return 0;
        }
        var readStringClusterName = parser.readString(buf, offset + bytesRead);
        cluster.name = readStringClusterName.value;
        bytesRead += parser.BYTES_INT + readStringClusterName.lengthInBytes;

        //Cluster id
        if (!parser.canReadShort(buf, offset + bytesRead)) {
            return 0;
        }

        cluster.id	= parser.readShort(buf, offset + bytesRead);
        bytesRead	+= parser.BYTES_SHORT;

        //Cluster type
        if (!parser.canReadString(buf, offset + bytesRead)) {
            return 0;
        }

        var readString	= parser.readString(buf, offset + bytesRead);
        cluster.type	= readString.value;
        bytesRead		+= parser.BYTES_INT + readString.lengthInBytes;

        //Cluster dataSegment Id
        if (!parser.canReadShort(buf, offset + bytesRead)) {
            return 0;
        }

        cluster.dataSegmentId	= parser.readShort(buf, offset + bytesRead);
        bytesRead				+= parser.BYTES_SHORT;

        //Insert cluster into collection
        clusters.push(cluster);
    }

    this.result.clusters	= clusters;
    this.step++;
    return bytesRead;
}

function readClusterConfig(buf, offset) {
	if (!parser.canReadString(buf, offset)) {
		return 0;
	}

	var readString		= parser.readString(buf, offset);
	this.result.config	= readString.value;

	this.step++;
	return parser.BYTES_INT + readString.lengthInBytes;
}

function readOrientRelease(buf, offset) {
	if (!parser.canReadString(buf, offset)) {
		return 0;
	}

	var readString		= parser.readString(buf, offset);
	this.result.release	= readString.value;

	this.step++;
	return parser.BYTES_INT + readString.lengthInBytes;
}

command.write = function(socket, sessionId, data, callback, manager) {
    debug.log("Writing on the socket operation " + command.operation + " on session " + sessionId);

    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback immediately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));

	//Driver name
    socket.write(parser.writeString(constants.driverName));
    //Driver version
    socket.write(parser.writeString(constants.driverVersion));
    //Protocol version
    socket.write(parser.writeShort(OperationTypes.SERVER_PROTOCOL_VERSION));
	//Client id
    socket.write(parser.writeString(''));
    //Database name
    socket.write(parser.writeString(data.databaseName));
    //Database type
    socket.write(parser.writeString(data.databaseType));
    //User name
    socket.write(parser.writeString(data.userName));
    //User password
    socket.write(parser.writeString(data.userPassword));
};