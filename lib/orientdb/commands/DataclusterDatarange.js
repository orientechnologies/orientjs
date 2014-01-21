'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);

        this.steps.push(readBegin);
        this.steps.push(readEnd);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DATACLUSTER_DATARANGE;

function readBegin(buf, offset) {
    if (!parser.canReadLong(buf, offset)) {
        return 0;
    }

    this.result.begin = parser.readLong(buf, offset);
    this.step++;
    return parser.BYTES_LONG;
}

function readEnd(buf, offset) {
    if (!parser.canReadLong(buf, offset)) {
        return 0;
    }
    this.result.end = parser.readLong(buf, offset);
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

    // cluster ID
    socket.write(parser.writeShort(data.clusterId));
};

