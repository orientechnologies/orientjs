'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);

        this.steps.push(readConfigValue);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_CONFIG_GET;

function readConfigValue(buf, offset) {
    if (!parser.canReadString(buf, offset)) {
        return 0;
    }

    var readConfigValue	= parser.readString(buf, offset);

    this.result.value	= readConfigValue.value;
    this.step++;

    return parser.BYTES_INT + readConfigValue.lengthInBytes;
}

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    // invoke callback immediately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));
    //Config key
    socket.write(parser.writeString(data.key));
};

