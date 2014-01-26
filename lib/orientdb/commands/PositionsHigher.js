'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);

        this.steps.push(positionsAvailable);
        this.steps.push(readPositions);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_POSITIONS_HIGHER;

function positionsAvailable(buf, offset) {
	this.result = [];

    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }

    this.positionsCount = parser.readInt(buf, offset);
    this.step++;

    return parser.BYTES_INT;
}

function readPositions(buf, offset) {
    if(this.positionsCount === 0) {
		this.step++;
	}

	var initialOffset	= offset;

    if (!parser.canReadLong(buf, offset)) {
        return 0;
    }

    var clusterPosition	= parser.readLong(buf, offset);
    offset += parser.BYTES_LONG;

    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }

    var dataSegmentId	= parser.readInt(buf, offset);
    offset += parser.BYTES_INT;

    if (!parser.canReadLong(buf, offset)) {
        return 0;
    }

    var dataSegmentPos	= parser.readLong(buf, offset);
    offset += parser.BYTES_LONG;

    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }

    var recordSize		= parser.readInt(buf, offset);
    offset += parser.BYTES_INT;

    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }

    var recordVersion	= parser.readInt(buf, offset);
    offset += parser.BYTES_INT;

    var position		= {
        clusterPosition: clusterPosition,
        dataSegmentId: dataSegmentId,
        dataSegmentPos: dataSegmentPos,
        recordSize: recordSize,
        recordVersion: recordVersion
    };

    this.result.push(position);

    if (this.result.length >= this.positionsCount) {
        this.step++;
    }

    return offset - initialOffset;
}

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback immediately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));

    //Cluster ID
    socket.write(parser.writeInt(data.clusterId));
    //Cluster position
    socket.write(parser.writeLong(data.clusterPosition));
};