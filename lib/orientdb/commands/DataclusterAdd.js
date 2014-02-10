'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);

        this.steps.push(readNumber);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DATACLUSTER_ADD;

function readNumber(buf, offset) {
    if (!parser.canReadShort(buf, offset)) {
        return 0;
    }

    this.result.clusterId	= parser.readShort(buf, offset);
    this.step++;
    return parser.BYTES_SHORT;
}

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback imidiately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));

    //Cluster type
    socket.write(parser.writeString(data.type));

    //Cluster  name
    socket.write(parser.writeString(data.name));

    //Physical location
    if(OperationTypes.SERVER_PROTOCOL_VERSION >= 10 || data.type === 'physical') {
        socket.write(parser.writeString(data.location));
    } else {
        socket.write(parser.writeString(null));
    }

	//Data segment name
	if(OperationTypes.SERVER_PROTOCOL_VERSION >= 10) {
		socket.write(parser.writeString(data.dataSegmentName));
	} else {
		socket.write(parser.writeInt(data.dataSegmentName));
	}

	//Cluster ID
	socket.write(parser.writeShort(data.clusterId));
};

