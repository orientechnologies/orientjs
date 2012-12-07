var util = require("util"),
    debug = require("../connection/debug"),
    packageInfo = require("../../../package.json"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readSessionId);
        this.steps.push(readClusters);
        this.steps.push(base.skipInt);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.DB_OPEN;

function readSessionId(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }
    this.result.sessionId = parser.readInt(buf, offset);
    this.step++;
    return parser.BYTES_INT;
}

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

    debug.log("Writing on the socket operation " + command.operation + " on session " + sessionId);

    // operation type
    socket.write(parser.writeByte(command.operation, true));

    // invoke callback immediately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId));

    // driver name
    socket.write(parser.writeString(packageInfo.description));
    // driver version
    socket.write(parser.writeString(packageInfo.version));
    // protocol version
    socket.write(parser.writeShort(12));
    // client id
    socket.write(parser.writeString(""));
    // database name
    socket.write(parser.writeString(data.database_name));
    // database type
    socket.write(parser.writeString(data.database_type));
    // user name
    socket.write(parser.writeString(data.user_name));
    // user password
    socket.write(parser.writeString(data.user_password));
};

