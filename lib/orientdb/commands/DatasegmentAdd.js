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
command.operation	= OperationTypes.REQUEST_DATASEGMENT_ADD;

function readNumber(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }

    this.result.segmentId	= parser.readInt(buf, offset);
    this.step++;
    return parser.BYTES_INT;
}

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback imidiately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));

    //Segment name
    socket.write(parser.writeString(data.segmentName));

    //Segment location
    socket.write(parser.writeString(data.segmentLocation));
};