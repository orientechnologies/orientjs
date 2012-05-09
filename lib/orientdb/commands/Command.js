var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.result = {};
        this.error = null;

        this.steps.push(base.skipByte);
        this.steps.push(base.skipInt);
        this.steps.push(readPayloadStatus);
        this.steps.push(readPayloadString);
        this.steps.push(readPayloadCollection);
        this.steps.push(readPayloadRecord);
    },

    markers = {
        readPayloadString: 3,
        readPayloadCollection: 4,
        readPayloadRecord: 5
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.COMMAND;


command.prototype.read = function(buf) {
    var bytesRead = 0,
        bytesRemaining = 0,
        bytesLingering = (this.lingeringBuffer && this.lingeringBuffer.length) || 0,
        totalBytesRead = bytesRead,
        localBuffer = new Buffer(buf.length + bytesLingering);

    if (bytesLingering) this.lingeringBuffer.copy(localBuffer);

    buf.copy(localBuffer, bytesLingering);

    while (!this.done() && (bytesRead = this.steps[this.step].call(this, localBuffer, totalBytesRead))) {
        totalBytesRead += bytesRead;
    }

    bytesRemaining = localBuffer.length - totalBytesRead;

    this.lingeringBuffer = new Buffer(bytesRemaining);

    localBuffer.copy(this.lingeringBuffer, 0, totalBytesRead);

    if (this.result.content) {
        if (this.result.content.length !== this.result.count) {
            totalBytesRead = buf.length;
        }
    }

    // Tell the caller how much of the buffer was consumed.
    return totalBytesRead > buf.length ? buf.length : totalBytesRead;
};


command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation, true));

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


function readPayloadCollection(buf, offset) {
    var result = this.result,
        objOffset = { offset: offset, limit: result.count },
        records = parser.readCollection(buf, objOffset);

    result.count = result.count || objOffset.limit;
    result.content = result.content || [];
    result.content = result.content.concat(records);

    if (result.content.length === result.count) {
        this.step = this.steps.length;
    }

    return objOffset.offset - offset;
}


function readPayloadRecord(buf, offset) {
    var result = this.result,
        objOffset = { offset: offset },
        record = parser.readRecord(buf, objOffset);

    result.content = record;

    this.step = this.steps.length;

    return objOffset.offset - offset;
}


function readPayloadStatus(buf, offset) {
    var result = this.result;

    result.status = parser.readByte(buf, offset);

    switch (result.status) {
        case 0:
            // TODO
            throw new Error("Not implemented!");
            break;
        case 1:
            // TODO
            throw new Error("Not implemented!");
            break;
        case 2:
            // TODO
            throw new Error("Not implemented!");
            break;
        case 97: // 'a'
            this.step = markers.readPayloadString;
            break;
        case 108: // 'l'
            this.step = markers.readPayloadCollection;
            break;
        case 110: // 'n'
            // nothing to do
            this.step = this.steps.length;
            break;
        case 114: // 'r'
            this.step = markers.readPayloadRecord;
            break;
        default:
            this.step = this.steps.length;
    }

    return 1; // byte read
}


function readPayloadString(buf, offset) {
    var result = this.result;

    result.content = parser.readString(buf, offset);
    result.type = "f";

    this.step = this.steps.length;

    return 4 + result.content.length;
}
