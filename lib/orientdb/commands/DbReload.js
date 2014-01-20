"use strict";

var util			= require("util"),
    base			= require("./CommandBase"),
    parser			= require("../connection/parser"),
    OperationTypes	= require("./operation_types"),

    command = function() {
        base.call(this);
        this.steps.push(readClusters);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DB_RELOAD;

function readClusters(buf, offset) {
    if (!parser.canReadShort(buf, offset)) {
        return 0;
    }

    var clusterCount = parser.readShort(buf, offset);
    var bytesRead = parser.BYTES_SHORT;

    var clusters = [];

    // clusters
    for (var idx = 0; idx < clusterCount; idx++) {
        var cluster = {};

        // cluster name
        if (!parser.canReadString(buf, offset + bytesRead)) {
            return 0;
        }
        var readStringClusterName = parser.readString(buf, offset + bytesRead);
        cluster.name = readStringClusterName.value;
        bytesRead += parser.BYTES_INT + readStringClusterName.lengthInBytes;

        // cluster id
        if (!parser.canReadShort(buf, offset + bytesRead)) {
            return 0;
        }
        cluster.id = parser.readShort(buf, offset + bytesRead);
        bytesRead += parser.BYTES_SHORT;

        // cluster type
        if (!parser.canReadString(buf, offset + bytesRead)) {
            return 0;
        }
        var readStringClusterType = parser.readString(buf, offset + bytesRead);
        cluster.type = readStringClusterType.value;
        bytesRead += parser.BYTES_INT + readStringClusterType.lengthInBytes;

        // cluster dataSegment Id
        if (!parser.canReadShort(buf, offset + bytesRead)) {
            return 0;
        }
        cluster.dataSegmentId = parser.readShort(buf, offset + bytesRead);
        bytesRead += parser.BYTES_SHORT;

        // insert cluster into collection
        clusters.push(cluster);
    }

    this.result.clusters = clusters;
    this.step++;
    return bytesRead;
}

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback immediately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));
};

