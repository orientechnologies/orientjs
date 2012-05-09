var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(base.skipByte);
        this.steps.push(base.skipInt);
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

command.prototype.read = function(buf) {
    var bytesRead = 0,
        bytesRemaining = 0,
        bytesLingering = (this.lingeringBuffer && this.lingeringBuffer.length) || 0,
        totalBytesRead = bytesRead,
        localBuffer = new Buffer(buf.length + bytesLingering);

    if (bytesLingering) this.lingeringBuffer.copy(localBuffer);

    buf.copy(localBuffer, bytesLingering);

    while (!this.done() && (bytesRead = this.steps[this.step].call(this, localBuffer, totalBytesRead))) {
        totalBytesRead += bytesRead;
    }

    bytesRemaining = localBuffer.length - totalBytesRead;

    this.lingeringBuffer = new Buffer(bytesRemaining);

    localBuffer.copy(this.lingeringBuffer, 0, totalBytesRead);

    if (!this.done()) {
        totalBytesRead = buf.length;
    }

    // Tell the caller how much of the buffer was consumed.
    return totalBytesRead > buf.length ? buf.length : totalBytesRead;
};

function readPayloadStatus(buf, offset) {
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

    return 1;
}

function readRecordContent(buf, offset) {
    if (!parser.canReadBytes(buf, offset)) {
        return 0;
    }
    this.result.content = parser.readBytes(buf, offset);

    this.step++;
    return 4 + this.result.content.length;
}

function readRecordVersion(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }
    this.result.version = parser.readInt(buf, offset);

    this.step++;
    return 4;
}

function readRecordType(buf, offset) {
    this.result.type = String.fromCharCode(parser.readByte(buf, offset));

    this.step++;
    return 1;
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

