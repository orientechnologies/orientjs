var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readPayloadStatus);
        this.steps.push(readRecordContent);
        this.steps.push(readRecordVersion);
        this.steps.push(readRecordType);
        this.steps.push(base.skipByte);
    };

util.inherits(command, base);

module.exports = command;

command.operation = OperationTypes.RECORD_LOAD;

// TODO we don't support fetchPlans in RECORD_LOAD, so we expect to return one and just one record

function readPayloadStatus(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
        return 0;
    }
    this.result.status = parser.readByte(buf, offset);

    switch (this.result.status) {
        case 0:
            this.step = this.steps.length;
            break;
        case 1:
            this.step++;
            break;
        default:
            throw new Error("Not implemented!");
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

command.write = function(socket, sessionId, data, callback) {

    // operation type
    socket.write(parser.writeByte(this.operation, true));

    // invoke callback imidiately when the operation is sent to the server
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
    socket.write(parser.writeByte(data.ignoreCache, true));
};

