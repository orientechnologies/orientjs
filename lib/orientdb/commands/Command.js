"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    _ = require("underscore"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.result = {};
        this.error = null;

        this.steps.push(readPayloadStatus);
        this.steps.push(readPayloadString);
        this.steps.push(readPayloadCollection);
        this.steps.push(readPayloadRecord);
        this.steps.push(readPayloadResultSetFirstRecord);
        this.steps.push(readPayloadResultSetPreFetchedRecordInitialShort);
        this.steps.push(readPayloadResultSetPreFetchedRecordRecordType);
        this.steps.push(readPayloadResultSetPreFetchedRecordRID);
        this.steps.push(readPayloadResultSetPreFetchedRecordVersion);
        this.steps.push(readPayloadResultSetPreFetchedRecord);
    },

    markers = {
        readPayloadStatus: 2,
        readPayloadString: 3,
        readPayloadCollection: 4,
        readPayloadRecord: 5,
        readPayloadResultSetFirstRecord: 6,
        readPayloadResultSetPreFetchedRecordInitialShort: 7
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.COMMAND;

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation));

    // invoke callback immediately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // mode
    socket.write(parser.writeByte(data.mode.charCodeAt()));

    // serialized command
    var buffers = [];

    buffers.push(parser.writeString(data.className));

    // query text
    buffers.push(parser.writeString(data.queryText));

    // non text limit
    buffers.push(parser.writeInt(data.nonTextLimit));

    // fetchplan
    buffers.push(parser.writeString(data.fetchPlan));

    // TODO serialized params
    buffers.push(parser.writeInt(0));

    // append all buffers into one
    var length = buffers.length;
    for (var idx = 0, size = 0; idx < length; idx++) {
        size += buffers[idx].length;
    }
    var buffer = new Buffer(size);
    for (var idx = 0, size = 0; idx < length; idx++) {
        size += buffers[idx].copy(buffer, size);
    }

    // serialized command
    socket.write(parser.writeBytes(buffer));
};


function readPayloadCollection(buf, offset) {
    var result = this.result,
        objOffset = { offset: offset, limit: result.count },
        records = parser.readCollection(buf, objOffset);

    // null check is NOT missing
    if (_.isUndefined(records)) {
        return 0;
    }

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
        objOffset = { offset: offset };

    var record = parser.readRecord(buf, objOffset);
    // null check is NOT missing
    if (_.isUndefined(record)) {
        return 0;
    }
    result.content = result.content || [];
    result.content.push(record);

    this.step = this.steps.length;

    return objOffset.offset - offset;
}


function readPayloadResultSetFirstRecord(buf, offset) {
    var readBytes = this.steps[markers.readPayloadRecord].call(this, buf, offset);
    if (readBytes === 0) {
        return 0;
    }

    this.step = markers.readPayloadStatus;

    return readBytes;
}


function readPayloadResultSetPreFetchedRecordInitialShort(buf, offset) {
    if (!parser.canReadShort(buf, offset)) {
        return 0;
    }

    if (parser.isNullOrUndefined(this.result.subcontents)) {
        this.result.subcontents = [];
    }

    this.result.subcontents.push({});

    this.step++;

    return parser.BYTES_SHORT;
}


function readPayloadResultSetPreFetchedRecordRecordType(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
        return 0;
    }

    var subcontent = _.last(this.result.subcontents);
    subcontent.type = String.fromCharCode(parser.readByte(buf, offset));

    this.step++;

    return parser.BYTES_BYTE;
}


function readPayloadResultSetPreFetchedRecordRID(buf, offset) {
    if (!parser.canReadShort(buf, offset)) {
        return 0;
    }
    if (!parser.canReadLong(buf, offset + parser.BYTES_SHORT)) {
        return 0;
    }

    var subcontent = _.last(this.result.subcontents);
    subcontent.rid = parser.toRid(parser.readShort(buf, offset), parser.readLong(buf, offset + parser.BYTES_SHORT));

    this.step++;

    return parser.BYTES_SHORT + parser.BYTES_LONG;
}


function readPayloadResultSetPreFetchedRecordVersion(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }

    var subcontent = _.last(this.result.subcontents);
    subcontent.version = parser.readInt(buf, offset);

    this.step++;

    return parser.BYTES_INT;
}


function readPayloadResultSetPreFetchedRecord(buf, offset) {
    if (!parser.canReadBytes(buf, offset)) {
        return 0;
    }

    var subcontent = _.last(this.result.subcontents);
    subcontent.content = parser.readBytes(buf, offset);

    this.step = markers.readPayloadStatus;

    return parser.BYTES_INT + subcontent.content.length;
}


function readPayloadStatus(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
        return 0;
    }
    var status = parser.readByte(buf, offset);

    switch (status) {
        case 0:
        case 110: // 'n'
            // nothing to do
            this.step = this.steps.length;
            break;
        case 1:
            this.step = markers.readPayloadResultSetFirstRecord;
            break;
        case 2:
            this.step = markers.readPayloadResultSetPreFetchedRecordInitialShort;
            break;
        case 97: // 'a'
            this.step = markers.readPayloadString;
            break;
        case 108: // 'l'
            this.step = markers.readPayloadCollection;
            break;
        case 114: // 'r'
            this.step = markers.readPayloadRecord;
            break;
        default:
            this.step = this.steps.length;
    }

    if (_.isUndefined(this.result.status)) {
        this.result.status = status;
    }

    return parser.BYTES_BYTE; // byte read
}


function readPayloadString(buf, offset) {
    if (!parser.canReadString(buf, offset)) {
        return 0;
    }

    var readString = parser.readString(buf, offset);
    this.result.content = readString.value;
    this.result.type = "f";

    this.step = this.steps.length;

    return parser.BYTES_INT + readString.lengthInBytes;
}
