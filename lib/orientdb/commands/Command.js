var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");

var Command = module.exports = function Command() {
};

Command.prototype.read = function(data, callback) {
	var self = this;

    // status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
    }

    var	result = {};

    // payload status
    result.status = data.readInt8(5);

    switch (result.status) {
        case 0:
            // TODO
            throw new Error("Not implemented!")
            break;
        case 1:
            // TODO
            throw new Error("Not implemented!")
            break;
        case 2:
            // TODO
            throw new Error("Not implemented!")
            break;
        case 97: // 'a'
            // TODO
            throw new Error("Not implemented!")
            break;
        case 108: // 'l'
            result.content = parser.readCollection(data, 6);
            break;
        case 110: // 'n'
            // TODO
            throw new Error("Not implemented!")
            break;
        case 114: // 'r'
            // TODO add test
            // waiting for Luca to respond to:
            // http://code.google.com/p/orient/source/browse/trunk/server/src/main/java/com/orientechnologies/orient/server/network/protocol/binary/ONetworkProtocolBinary.java?r=4742#747
            var record = this.readRecord(data, 6);
            delete record._end;
            result.content = record;
            break;
    }

	callback(undefined, result);
};


Command.prototype.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(OperationTypes.COMMAND, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));

    // mode
    socket.write(parser.writeByte(data.mode.charCodeAt(), true));

    // serialized command
    var buffers = [];

    // TODO query class name
    buffers.push(parser.writeString("com.orientechnologies.orient.core.sql.OCommandSQL"));

    // query text
    buffers.push(parser.writeString(data.query_text));

    // non text limitt
    buffers.push(parser.writeInt(data.non_text_limit || -1));

    // fetchplan
    buffers.push(parser.writeString(data.fetchplan || ""));

    // TODO serialized params
    //buffers.push(parser.writeInt(data.serialized_params));
    buffers.push(parser.writeInt(0));

    // append all buffers into one
    var length = buffers.length;
    var size = 0;
    for (var i = 0; i < length; i++) {
        size += buffers[i].length;
    }
    var buffer = new Buffer(size);
    size = 0;
    for (var i = 0; i < length; i++) {
        size += buffers[i].copy(buffer, size);
    }

    // serialized command
    socket.write(parser.writeBytes(buffer));
};

