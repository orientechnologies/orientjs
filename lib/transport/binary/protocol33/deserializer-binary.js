"use strict";

var nativeDeserializer = require('orientjs-native');

var RecordID = require('../../../recordid');
var baseDeserializer = require('./deserializer');
var Bag = require('../../../bag');
var BigInteger = require("node-biginteger");

function decimalRead(buffer,scale) {
	var num;
	var bigi;
	if((buffer[0] & 0x80) === 0){
		bigi = BigInteger.fromBuffer(1,buffer);
		num = bigi.longValue().toNumber();
	}
	else { 
		for(var cur =0;cur < buffer.length; cur ++ ) {
			buffer[cur] = (buffer[cur] ^ 0xff);
		}
		bigi = BigInteger.fromBuffer(-1,buffer);
		num = bigi.longValue().toNumber();
		// the XOR 0xFF moved the value of 1 unit, change it back
		num -=1;
	}
	var  realScale =1;
	while(scale > 0) {
		realScale *= 10;
		scale -=1;
	}
	return num / realScale;
}


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
        record = nativeDeserializer.deserialize(input,RecordID,Bag,decimalRead,baseDeserializer.enableRIDBags);
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
