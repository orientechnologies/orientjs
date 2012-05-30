var parser = require("./parser");

module.exports.parse = function(data) {

    // skip status byte, session id and first byte (always 1)
    var offset = parser.BYTES_BYTE + parser.BYTES_INT + parser.BYTES_BYTE;
    var errors = [];

    var more = true;

    while (more) {

        var error = {};

        // exception class
        var errorClass = parser.readString(data, offset);
        error["class"] = errorClass.value;
        offset += parser.BYTES_INT + errorClass.lengthInBytes;

        // exception class
        var errorMessage = parser.readString(data, offset);
        error.message = errorMessage.value;
        offset += parser.BYTES_INT + errorMessage.lengthInBytes;

        // add to results
        errors.push(error);

        more = parser.readByte(data, offset);
        offset += parser.BYTES_BYTE;
    }

    return errors;

};

