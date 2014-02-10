'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);

        this.steps.push(readStatus);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_RECORD_DELETE;

function readStatus(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
		this.result = false;
		return 0;
    }

    this.result = parser.readByte(buf, offset) ? true : false;
    this.step++;
    return parser.BYTES_BYTE;
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
    // cluster position
    socket.write(parser.writeLong(data.clusterPosition));
    // record version
    socket.write(parser.writeInt(data.version));
    // mode
    socket.write(parser.writeByte(data.mode));
};

