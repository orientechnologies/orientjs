"use strict";

var deserializer = null;
try {
    deserializer = require('./deserializer-binary');
} catch (e) {
    deserializer = require('./deserializer-csv');
}





exports.enableRIDBags = deserializer.enableRIDBags;
exports.deserialize = deserializer.deserialize;
exports.eatKey = deserializer.eatKey;
exports.eatValue = deserializer.eatValue;
exports.eatString = deserializer.eatString;
exports.eatNumber = deserializer.eatNumber;
exports.eatRID = deserializer.eatRID;
exports.eatArray = deserializer.eatArray;
exports.eatSet = deserializer.eatSet;
exports.eatMap = deserializer.eatMap;
exports.eatRecord = deserializer.eatRecord;
exports.eatBag = deserializer.eatBag;
exports.eatBinary = deserializer.eatBinary;
