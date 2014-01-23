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
    var clusterCount	= 0;

	if(OperationTypes.SERVER_PROTOCOL_VERSION >= 7) {
		if (!parser.canReadShort(buf, offset)) {
			return 0;
		}

		clusterCount	= parser.readShort(buf, offset);
	} else {
		if (!parser.canReadInt(buf, offset)) {
			return 0;
		}

		clusterCount	= parser.readInt(buf, offset);
	}

    var bytesRead		= parser.BYTES_SHORT;
    var clusters		= [];

	//Clusters
    for (var g=0; g<clusterCount; g++) {
        var cluster = {};

		//Cluster name
        if (!parser.canReadString(buf, offset + bytesRead)) {
		    return 0;
        }

        var clusterName	= parser.readString(buf, offset + bytesRead);
        cluster.name	= clusterName.value;
        bytesRead		+= parser.BYTES_INT + clusterName.lengthInBytes;

        //Cluster id
        if (!parser.canReadShort(buf, offset + bytesRead)) {
            return 0;
        }

        cluster.id		= parser.readShort(buf, offset + bytesRead);
        bytesRead		+= parser.BYTES_SHORT;

        //Cluster type
        if (!parser.canReadString(buf, offset + bytesRead)) {
            return 0;
        }

        var clusterType	= parser.readString(buf, offset + bytesRead);
        cluster.type	= clusterType.value;
        bytesRead		+= parser.BYTES_INT + clusterType.lengthInBytes;

        //Cluster dataSegment Id
		if(OperationTypes.SERVER_PROTOCOL_VERSION >= 12) {
			if (!parser.canReadShort(buf, offset + bytesRead)) {
				return 0;
			}

			cluster.dataSegmentId = parser.readShort(buf, offset + bytesRead);
			bytesRead		+= parser.BYTES_SHORT;
		}

        //Insert cluster into collection
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

