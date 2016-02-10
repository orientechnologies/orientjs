
"use strict";

var nativeSerializer = require('orientjs-native');

exports.serializeDocument= function (doc){
       	return nativeSerializer.serialize(doc);
};


