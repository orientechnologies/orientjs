'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);

        this.steps.push(readByte);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DATACLUSTER_DROP;

function readByte(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
        return 0;
    }

    this.result.status	= parser.readByte(buf, offset);
    this.step++;
    return parser.BYTES_BYTE;
}

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback imidiately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));

    //Cluster number
    socket.write(parser.writeShort(data.clusterId));
};

