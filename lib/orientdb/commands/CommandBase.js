var command = function() {
    this.step = 0;
    this.steps = [];
    this.result = {};
    this.error = null;
};

command.prototype.done = function() {
    return this.step >= this.steps.length;
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