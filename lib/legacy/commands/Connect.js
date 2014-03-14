'use strict';

var util			= require('util'),
    packageInfo		= require('../../../package.json'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
	OperationTypes	= require('./operation_types'),
	constants		= require('../constants.js'),

    command = function() {
        base.call(this);
        this.steps.push(readSessionId);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_CONNECT;

function readSessionId(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }

    this.result.sessionId = parser.readInt(buf, offset);
    this.step++;
    return parser.BYTES_INT;
}

command.write = function(socket, sessionId, data, callback, manager) {
    // operation type
    socket.write(parser.writeByte(command.operation));

    // invoke callback immediately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    //Driver name
    socket.write(parser.writeString(constants.driverName));
    //Driver version
    socket.write(parser.writeString(constants.driverVersion));
    //Protocol version
    socket.write(parser.writeShort(OperationTypes.SERVER_PROTOCOL_VERSION));
    //Client id
    socket.write(parser.writeString(''));
    //Username
    socket.write(parser.writeString(data.userName));
    //User password
    socket.write(parser.writeString(data.userPassword));
};
