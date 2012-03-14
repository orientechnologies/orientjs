var parser = require("../connection/parser"),
    OperationTypes = require("./operation_types");

var DbOpen = module.exports = function DbOpen() {
};

DbOpen.prototype.read = function(data, callback) {

    // status
    var status = parser.readByte(data, 0);
    if (status) {
        callback (data);
        return;
    }

    var	result = {
        sessionId: -1,
        clusterConfig: null
    };

    // session ID
    result.sessionId = parser.readInt(data, 5);

    // number of clusters
    var clusterCount = parser.readShort(data, 9);

    var clusters = [];
    // clusters
    for (var i = 0, indexCursor = 11; i < clusterCount; i++) {
        var cluster = {};

        // cluster name
        cluster.name = parser.readString(data, indexCursor);
        indexCursor += cluster.name.length + 4;

        // cluster id
        cluster.id = parser.readShort(data, indexCursor);
        indexCursor += 2;

        // cluster type
        cluster.type = parser.readString(data, indexCursor);
        indexCursor += cluster.type.length + 4;

        // insert cluster into collection
        clusters.push(cluster);
    }

    result.clusters = clusters;
    
    callback(undefined, result);
};


DbOpen.prototype.write = function(socket, sessionId, data, callback) {

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

