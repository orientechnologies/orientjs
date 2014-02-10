'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);

        this.steps.push(readClusterCount);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DATACLUSTER_COUNT;

function readClusterCount(buf, offset) {
    if (!parser.canReadLong(buf, offset)) {
		this.result	= 0;
        return 0;
    }

    this.result	= parser.readLong(buf, offset);
    this.step++;
    return parser.BYTES_LONG;
}

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback imidiately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));

    //Clusters array length
    socket.write(parser.writeShort(data.clustersId.length));

    // clusters ids
    for (var idx = 0, length = data.clustersId.length; idx < length; idx++) {
        socket.write(parser.writeShort(data.clustersId[idx]));
    }

	if (OperationTypes.SERVER_PROTOCOL_VERSION >= 13) {
		//Load tombstone
		socket.write(parser.writeByte(data.loadTombstones));
	}
}