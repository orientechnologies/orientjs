var command = function(callback) {
    this.callback = callback;
    this.done = false;

    this.step = 0;
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