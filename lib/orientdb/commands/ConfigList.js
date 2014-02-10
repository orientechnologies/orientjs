'use strict';

var util			= require('util'),
    base			= require('./CommandBase'),
    parser			= require('../connection/parser'),
    OperationTypes	= require('./operation_types'),

    command = function() {
        base.call(this);

        this.steps.push(readConfigListCount);
        this.steps.push(readConfigList);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_CONFIG_LIST;

function readConfigListCount(buf, offset) {
    if (!parser.canReadShort(buf, offset)) {
        return 0;
    }
    this.result.count	= parser.readShort(buf, offset);
    this.result.config	= [];

    if (this.result.count > 0) {
        this.step++;
    } else {
        this.step = this.steps.length;
    }

    return parser.BYTES_SHORT;
}

function readConfigList(buf, offset) {
    if (!parser.canReadString(buf, offset)) {
        return 0;
    }

    var readKey = parser.readString(buf, offset);

    if (!parser.canReadString(buf, offset + parser.BYTES_INT + readKey.lengthInBytes)) {
        return 0;
    }

    var readValue = parser.readString(buf, offset + parser.BYTES_INT + readKey.lengthInBytes);

    this.result.config.push({
        key: readKey.value,
        value: readValue.value
    });

    if (this.result.config.length === this.result.count) {
        this.step++;
    }

    return parser.BYTES_INT * 2 + readKey.lengthInBytes + readValue.lengthInBytes;
}

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback immediately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));
};

