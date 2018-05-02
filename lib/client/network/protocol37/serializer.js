"use strict";

var serializer = require('./serializer-binary');
var encodeRecordData = function (content) {
  return serializer.serializeDocument(content);
};

exports.serializeDocument = serializer.serializeDocument;
exports.serializeValue = function () {
};
exports.encodeRecordData = encodeRecordData;



