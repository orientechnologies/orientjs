var util = require("util"),
    base = require("./CommandBase"),
    parser = require("../connection/parser"),
    OperationTypes = require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readError);
    };

util.inherits(command, base);

module.exports = command;

/*
 This is not a real command, rather a way to correctly handle data chunk reads 
 mimicking other commands behaviour (canRead* + read* sequences)
 */
command.operation = OperationTypes.ERROR_COMMAND;


function readError(buf, offset) {
    if (!parser.canReadError(buf, offset)) {
        return 0;
    }
    var objOffset = { offset: offset };
    this.error = new Error(JSON.stringify(parser.readError(buf, objOffset)));
    this.step++;
    return objOffset.offset - offset;
}

command.write = function() {
    throw new Error("Unsupported operation");
};

