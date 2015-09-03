"use strict";

var nativeDeserializer = require('bindings')('deserializer');


function deserialize(input, classes) {

    if (!input) {
        return null;
    }
    var record = null;
    try {
        record = nativeDeserializer.deserialize(input);
    } catch (e) {
        console.log(e);
    }
    if (classes && record['@class'] && classes[record['@class']]) {
        return classes[record['@class']](record);
    }
    return record;
}


exports.enableRIDBags = true;
exports.deserialize = deserialize;
