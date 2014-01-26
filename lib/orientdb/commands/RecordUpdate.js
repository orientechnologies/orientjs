'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);

        this.steps.push(readRecordVersion);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_RECORD_UPDATE;

function readRecordVersion(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }
    this.result.version = parser.readInt(buf, offset);
    this.step++;
    return parser.BYTES_INT;
}

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback immediately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));

    //Cluster ID
    socket.write(parser.writeShort(data.clusterId));
    //Cluster position
    socket.write(parser.writeLong(data.clusterPosition));
    //Record data
    socket.write(parser.writeBytes(data.content));
    //Record version
    socket.write(parser.writeInt(data.version));
    //Record type
    socket.write(parser.writeByte(data.type));
    //Mode
    socket.write(parser.writeByte(data.mode));
};

