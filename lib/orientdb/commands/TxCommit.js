"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    _ = require("lodash"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readRecordsCreatedCount);
        this.steps.push(readRecordsCreated);
        this.steps.push(readRecordsUpdatedCount);
        this.steps.push(readRecordsUpdated);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.REQUEST_TX_COMMIT;

function readRecordsCreatedCount(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }

    this.result.numberOfRecordsCreated = parser.readInt(buf, offset);
    this.result.recordsCreated = [];

    if (this.result.numberOfRecordsCreated > 0) {
        this.step++;
    } else {
        this.step += 2;
    }

    return parser.BYTES_INT;
}

function readRecordsCreated(buf, offset) {
    var bytesToRead = (parser.BYTES_SHORT * 2) + (parser.BYTES_LONG * 2);
    if (offset + bytesToRead > buf.length) {
        return 0;
    }

    var createdRecordRIDs = {
        fromClusterId: parser.readShort(buf, offset),
        fromClusterPosition: parser.readLong(buf, offset + parser.BYTES_SHORT),
        toClusterId: parser.readShort(buf, offset + parser.BYTES_SHORT + parser.BYTES_LONG),
        toClusterPosition: parser.readLong(buf, offset + parser.BYTES_SHORT + parser.BYTES_LONG + parser.BYTES_SHORT)
    };

    this.result.recordsCreated.push(createdRecordRIDs);
    if (this.result.recordsCreated.length === this.result.numberOfRecordsCreated) {
        this.step++;
    }

    return bytesToRead;
}

function readRecordsUpdatedCount(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }

    this.result.numberOfRecordsUpdated = parser.readInt(buf, offset);
    this.result.recordsUpdated = [];

    if (this.result.numberOfRecordsUpdated > 0) {
        this.step++;
    } else {
        this.step += 2;
    }

    return parser.BYTES_INT;
}

function readRecordsUpdated(buf, offset) {
    var bytesToRead = parser.BYTES_SHORT + parser.BYTES_LONG + parser.BYTES_INT;
    if (offset + bytesToRead > buf.length) {
        return 0;
    }

    var updatedRecordRIDs = {
        clusterId: parser.readShort(buf, offset),
        clusterPosition: parser.readLong(buf, offset + parser.BYTES_SHORT),
        version: parser.readInt(buf, offset + parser.BYTES_SHORT + parser.BYTES_LONG)
    };

    this.result.recordsUpdated.push(updatedRecordRIDs);
    if (this.result.recordsUpdated.length === this.result.numberOfRecordsUpdated) {
        this.step++;
    }

    return bytesToRead;
}

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(this.operation));

    // invoke callback immediately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // transaction ID
    socket.write(parser.writeInt(data.id));

    // use transaction log to recover
    socket.write(parser.writeByte(1));

    for (var idx = 0, length = data.docs.length; idx < length; idx++) {
        // === 1 means: one more doc is part of this transaction
        socket.write(parser.writeByte(1));

        var doc = data.docs[idx];

        // operation type
        switch (data.actions[idx]) {
            case "create":
                socket.write(parser.writeByte(3));
                break;
            case "update":
                socket.write(parser.writeByte(1));
                break;
            case "delete":
                socket.write(parser.writeByte(2));
                break;
            default:
                callback(new Error("Unknown action: " + data.actions[idx]));
                return;
        }

        // cluster id and position
        var rid = parser.parseRid(doc["@rid"]);
        socket.write(parser.writeShort(rid.clusterId));
        socket.write(parser.writeLong(rid.clusterPosition));

        // record type
        var type;
        if (doc["@type"]) {
            type = doc["@type"];
        } else {
            type = "d";
        }
        type = parser.decodeRecordType(type);
        socket.write(parser.writeByte(type));

        switch (data.actions[idx]) {
            case "create":
                socket.write(parser.writeBytes(parser.stringToBuffer(parser.serializeDocument(doc))));
                break;
            case "update":
                socket.write(parser.writeInt(doc["@version"]));
                socket.write(parser.writeBytes(parser.stringToBuffer(parser.serializeDocument(doc))));
                break;
            case "delete":
                socket.write(parser.writeInt(doc["@version"]));
                break;
            default:
                callback(new Error("Unknown action: " + data.actions[idx]));
                return;
        }

    }
    // !== 1 means: no more docs
    socket.write(parser.writeByte(2));

    socket.write(parser.writeString(""));
};

