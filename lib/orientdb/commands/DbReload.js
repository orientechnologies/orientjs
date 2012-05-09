var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readClusters);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.DB_RELOAD;

function readClusters(buf, offset) {
    if (!parser.canReadShort(buf, offset)) {
        return 0;
    }

    var clusterCount = parser.readShort(buf, offset);
    var bytesRead = parser.BYTES_SHORT;

    var clusters = [];

    // clusters
    for (var i = 0; i < clusterCount; i++) {
        var cluster = {};

        // cluster name
        if (!parser.canReadString(buf, offset + bytesRead)) {
            return 0;
        }
        cluster.name = parser.readString(buf, offset + bytesRead);
        bytesRead += parser.BYTES_INT + cluster.name.length;

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
        cluster.type = parser.readString(buf, offset + bytesRead);
        bytesRead += parser.BYTES_INT + cluster.type.length;

        // insert cluster into collection
        clusters.push(cluster);
    }

    this.result.clusters = clusters;
    this.step++;
    return bytesRead;
}

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(command.operation, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));
};

