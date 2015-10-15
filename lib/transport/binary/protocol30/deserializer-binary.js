"use strict";

var nativeDeserializer = require('bindings')('deserializer');

var RecordID = require('../../../recordid');
var Bag = require('../../../bag');

function deserialize(input, classes) {

    if (!input) {
        return null;
    }
    if(!(input instanceof  Buffer)){
	    var err = new Error();
	    console.log( err.stack );
    }
    var record = null;
    try {
        record = nativeDeserializer.deserialize(input,RecordID,Bag);
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
