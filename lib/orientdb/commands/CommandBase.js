var parser = require("../connection/parser");

var command = function() {
    this.step = 0;

    this.steps = [];
    this.steps.push(command.skipByte);
    this.steps.push(command.skipInt);

    this.result = {};
    this.error = null;
};

command.prototype.done = function() {
    return this.step >= this.steps.length;
};

command.prototype.read = function(buf) {
    var bytesRead = 0,
        bytesLingering = (this.lingeringBuffer && this.lingeringBuffer.length) || 0,
        totalBytesRead = bytesRead,
        localBuffer = new Buffer(buf.length + bytesLingering);

    if (bytesLingering) this.lingeringBuffer.copy(localBuffer);

    buf.copy(localBuffer, bytesLingering);

    while (!this.done() && (bytesRead = this.steps[this.step].call(this, localBuffer, totalBytesRead))) {
        totalBytesRead += bytesRead;
    }

    this.lingeringBuffer = new Buffer(localBuffer.length - totalBytesRead);

    localBuffer.copy(this.lingeringBuffer, 0, totalBytesRead);

    if (!this.done()) {
        totalBytesRead = buf.length;
    }

    // Tell the caller how much of the buffer was consumed.
    return totalBytesRead > buf.length ? buf.length : totalBytesRead;
};

command.skipByte = function(buf, offset) {
    if (!parser.canReadByte(buf, offset)) {
        return 0;
    }
    this.step++;
    return parser.BYTES_BYTE;
};


command.skipInt = function(buf, offset) {
    if (!parser.canReadInt(buf, offset)) {
        return 0;
    }
    this.step++;
    return parser.BYTES_INT;
};


module.exports = command;