'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);
		this.steps.push(onComplete);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DB_CREATE;

function onComplete(buf, offset) {
	this.result.status	= 1;
	this.step++;
	return 0;
}

command.write	= function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback immediately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));

    //Database name
    socket.write(parser.writeString(data.databaseName));
    //Database type
    socket.write(parser.writeString(data.databaseType));
    //Storage type
    socket.write(parser.writeString(data.storageType));
};

