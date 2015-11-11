
"use strict";

var nativeSerializer = require('bindings')('deserializer');

exports.serializeDocument= function (doc){
       	return nativeSerializer.serialize(doc);
};


