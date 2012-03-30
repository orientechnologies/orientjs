var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");

module.exports.operation = OperationTypes.COMMAND;

module.exports.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1

    // skip the session ID
    offset += 4;

    var result = {};

    // payload status
    result.status = parser.readByte(buf, offset);
    offset += 1;

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
            result.content = parser.readString(buf, offset);
            offset += 4 + result.content.length;
            result.type = "f";
            break;
        case 108: // 'l'
            var objOffset = { offset: offset };
            result.content = parser.readCollection(buf, objOffset);
            offset = objOffset.offset;
            break;
        case 110: // 'n'
            // TODO
            throw new Error("Not implemented!")
            break;
        case 114: // 'r'
            var objOffset = { offset: offset };
            var record = parser.readRecord(buf, objOffset);
            offset = objOffset.offset;
            result.content = record;
            break;
    }

    data.index = offset;

    callback(undefined, result);
};


module.exports.write = function(socket, sessionId, data, callback) {

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

