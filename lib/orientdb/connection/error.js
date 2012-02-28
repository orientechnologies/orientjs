var parser = require("./Parser"),
	debug = require("./Debug");


	
module.exports.parse = function(data) {
    debugger;
	var indexCursor = 0,
		response = {pairs: []},
		tempInt, tempClass, tempMessage;
    
	var more = data.readUInt8(indexCursor);
	
    // session ID
    var sid = data.readInt32BE(++indexCursor);
    indexCursor += 4;

    more = data.readUInt8(indexCursor++);

    while (more) {

        // exception class
        tempClass = parser.readString(data, indexCursor);
        indexCursor += tempClass.length + 4;

        // exception class
        tempMessage = parser.readString(data, indexCursor);
        indexCursor += tempMessage.length + 4;

        // add to results
        response.pairs.push({
            class: tempClass,
            message: tempMessage
        });
		
        more = data.readUInt8(indexCursor++);
	}
	
	return response;
};

