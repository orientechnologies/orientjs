var command = function() {
    this.step = 0;
    this.steps = [];
    this.result = {};
    this.error = null;
};

command.prototype.done = function() {
    return this.step >= this.steps.length;
};

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

command.skipByte = function() {
    this.step++;

    return 1;
};


command.skipInt = function() {
    this.step++;

    return 4;
};


module.exports = command;