var parser = require("./parser");

module.exports.parse = function(data) {

    var indexCursor = 0;
    var response = [],
        tempClass, tempMessage;

    // jump over status since this is already 1
    indexCursor++;

    // jump over session ID
    indexCursor += 4;

    var more = data.readUInt8(indexCursor++);

    while (more) {

        // exception class
        var readStringTempClass = parser.readString(data, indexCursor);
        tempClass = readStringTempClass.value;
        indexCursor += parser.BYTES_INT + readStringTempClass.lengthInBytes;

        // exception class
        var readStringTempMessage = parser.readString(data, indexCursor);
        tempMessage = readStringTempMessage.value;
        indexCursor += parser.BYTES_INT + readStringTempMessage.lengthInBytes;

        // add to results
        response.push({
            "class": tempClass,
            message: tempMessage
        });

        more = data.readUInt8(indexCursor++);
    }

    return response;
};

