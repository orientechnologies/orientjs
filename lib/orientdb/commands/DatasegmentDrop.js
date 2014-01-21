'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);

        this.steps.push(readSuccessfulByte);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DATASEGMENT_DROP;

function readSuccessfulByte(buf, offset) {
    if (!parser.canReadBoolean(buf, offset)) {
        return 0;
    }

    this.result.status	= parser.readBoolean(buf, offset);
    this.step++;
    return parser.BYTES_BYTE;
}

command.write = function(socket, sessionId, segmentName, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback imidiately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));

    //Segment name
    socket.write(parser.writeString(segmentName));
};
