"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    _ = require("underscore"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readPayloadStatus);
        this.steps.push(readRecordContent);
        this.steps.push(readRecordVersion);
        this.steps.push(readRecordType);
        this.steps.push(readPayloadStatus);
        this.steps.push(readSubRecordIdentifiable);
        this.steps.push(readSubRecordType);
        this.steps.push(readSubRecordRID);
        this.steps.push(readSubRecordVersion);
        this.steps.push(readSubRecordContent);
        this.steps.push(readPayloadStatus);
    },

    markers = {
        readRecordContent: 3,
        readSubRecordIdentifiable: 7
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.RECORD_LOAD;

function readPayloadStatus(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
        return 0;
    }
    var status = parser.readByte(buf, offset);

    switch (status) {
        case 0:
            this.step = this.steps.length;
            if (_.isUndefined(this.result.status)) {
                this.result.status = status;
            }
            break;
        case 1:
            this.result.status = status;
            this.step = markers.readRecordContent;
            break;
        case 2:
            this.step = markers.readSubRecordIdentifiable;
            break;
        default:
            this.error = new Error("Payload status " + status + " not implemented!");
            break;
    }

    return parser.BYTES_BYTE;
}

function readRecordContent(buf, offset) {
    if (!parser.canReadBytes(buf, offset)) {
        return 0;
    }
    this.result.content = parser.readBytes(buf, offset);
    this.step++;
    return parser.BYTES_INT + this.result.content.length;
}

function readRecordVersion(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }
    this.result.version = parser.readInt(buf, offset);
    this.step++;
    return parser.BYTES_INT;
}

function readRecordType(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
        return 0;
    }
    this.result.type = String.fromCharCode(parser.readByte(buf, offset));
    this.step++;
    return parser.BYTES_BYTE;
}

function readSubRecordIdentifiable(buf, offset) {
    if (!parser.canReadShort(buf, offset)) {
        return 0;
    }
    var classId = parser.readShort(buf, offset);

    switch (classId) {
        case -2:
            this.step = this.steps.length;
            break;
        case -3:
            throw new Error("ClassID " + classId + " not supported");
        default:
            if (parser.isNullOrUndefined(this.result.subcontents)) {
                this.result.subcontents = [];
            }
            this.result.subcontents.push({});
            this.step++;
            break;
    }

    return parser.BYTES_SHORT;
}

function readSubRecordType(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
        return 0;
    }
    var subcontent = this.result.subcontents[this.result.subcontents.length - 1];
    subcontent.type = String.fromCharCode(parser.readByte(buf, offset));
    
    this.step++;

    return parser.BYTES_BYTE;
}

function readSubRecordRID(buf, offset) {
    if (!parser.canReadShort(buf, offset)) {
        return 0;
    }
    if (!parser.canReadLong(buf, offset + parser.BYTES_SHORT)) {
        return 0;
    }

    var subcontent = this.result.subcontents[this.result.subcontents.length - 1];
    subcontent.rid = parser.toRid(parser.readShort(buf, offset), parser.readLong(buf, offset + parser.BYTES_SHORT));

    this.step++;

    return parser.BYTES_SHORT + parser.BYTES_LONG;
}

function readSubRecordVersion(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }

    var subcontent = this.result.subcontents[this.result.subcontents.length - 1];
    subcontent.version = parser.readInt(buf, offset);
    
    this.step++;
    
    return parser.BYTES_INT;
}

function readSubRecordContent(buf, offset) {
    if (!parser.canReadBytes(buf, offset)) {
        return 0;
    }
    var subcontent = this.result.subcontents[this.result.subcontents.length - 1];
    
    subcontent.content = parser.readBytes(buf, offset);
    
    this.step++;
    
    return parser.BYTES_INT + subcontent.content.length;
}

command.write = function(socket, sessionId, data, callback, manager) {

    // operation type
    socket.write(parser.writeByte(this.operation));

    // invoke callback immediately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // cluster ID
    socket.write(parser.writeShort(data.clusterId));
    // cluster position
    socket.write(parser.writeLong(data.clusterPosition));

    // fetch plan
    socket.write(parser.writeString(data.fetchPlan));

    // ignore cache
    socket.write(parser.writeByte(data.ignoreCache));
    
    // https://github.com/nuvolabase/orientdb/issues/1272
    if (manager.serverProtocolVersion >= 13) {
        // load tombstone
        socket.write(parser.writeByte(0));
    }
};

