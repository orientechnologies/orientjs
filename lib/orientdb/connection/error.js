var parser = require("./parser"),
	debug = require("./debug");


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
        tempClass = parser.readString(data, indexCursor);
        indexCursor += tempClass.length + 4;

        // exception class
        tempMessage = parser.readString(data, indexCursor);
        indexCursor += tempMessage.length + 4;

        // add to results
        response.push({
            class: tempClass,
            message: tempMessage
        });

        more = data.readUInt8(indexCursor++);
    }

    return response;
};

