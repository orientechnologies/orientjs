"use strict";

var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    _ = require("underscore"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

    },

    markers = {
        readRecordContent: 3,
        readSubRecordIdentifiable: 7
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.TX_COMMIT;

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

    for (var idx in data.docs) {
        // === 1 means: one more doc is part of this transaction
        socket.write(parser.writeByte(1));

        var doc = data.docs[idx];

        // operation type
        switch (data.actions[idx]) {
            case "create":
                socket.write(parser.writeByte(3));
                break;
            case "update":
                // TODO
                throw new Error("unsupported");
                //socket.write(parser.writeByte(1));
                //break;
            case "delete":
                // TODO
                throw new Error("unsupported");
                //socket.write(parser.writeByte(2));
                //break;
            default:
                callback("Uknown action: " + data.actions[idx]);
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

        socket.write(parser.writeBytes(parser.stringToBuffer(parser.serializeDocument(doc))));
    }
    // !== 1 means: no more docs
    socket.write(parser.writeByte(2));

    socket.write(parser.writeString(""));
};

