'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_SHUTDOWN;

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback immediately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId, true));

    //Username
    socket.write(parser.writeString(data.username));
    //Password
    socket.write(parser.writeString(data.password));
};

