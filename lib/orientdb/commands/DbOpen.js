var parser = require("../connection/parser"),
    debug = require("../connection/debug"),
    OperationTypes = require("./operation_types");


var DbOpen = module.exports = function DbOpen() {
};

DbOpen.prototype.read = function(data, callback) {

    var buf = data.buffer,
        offset = data.index;

    // skip status, non-zero caught by manager
    offset += 1

    // skip the invalid/negative session ID
    offset += 4;

    var	result = {
        sessionId: -1,
        clusterConfig: null
    };

    // session ID
    result.sessionId = parser.readInt(buf, offset);
    offset += 4;

    // number of clusters
    var clusterCount = parser.readShort(buf, offset);
    offset += 2;

    var clusters = [];

    // clusters
    for (var i = 0; i < clusterCount; i++) {
        var cluster = {};

        // cluster name
        cluster.name = parser.readString(buf, offset);
        offset += cluster.name.length + 4;

        // cluster id
        cluster.id = parser.readShort(buf, offset);
        offset += 2;

        // cluster type
        cluster.type = parser.readString(buf, offset);
        offset += cluster.type.length + 4;

        // insert cluster into collection
        clusters.push(cluster);
    }

    // skip the null cluster configuration
    // TODO what if the configuration is not null?
    offset += 4;

    data.index = offset;
    result.clusters = clusters;

    callback(undefined, result);
};


DbOpen.prototype.write = function(socket, sessionId, data, callback) {

    debug.log("Writing on the socket operation " + OperationTypes.DB_OPEN + " on session " + sessionId);

    // operation type
    socket.write(parser.writeByte(OperationTypes.DB_OPEN, true));

    // invoke callback imidiately when the operation is sent to the server
    callback();

    // session ID
    socket.write(parser.writeInt(sessionId, true));

    // driver name
    socket.write(parser.writeString("OrientDB Node.js driver"));
    // driver version
    socket.write(parser.writeString("0.0.1"));
    // protocol version
    socket.write(parser.writeShort(7));
    // client id
    socket.write(parser.writeString(""));
    // database name
    socket.write(parser.writeString(data.database_name));
    // database type
    // TODO starting with protocol version 8
    //socket.write(parser.writeString("graph"));
    // user name
    socket.write(parser.writeString(data.user_name));
    // user password
    socket.write(parser.writeString(data.user_password));
};

