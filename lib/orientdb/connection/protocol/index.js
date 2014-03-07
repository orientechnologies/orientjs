['constants', 'reader', 'writer', 'record-reader', 'collection-reader', 'error-reader', 'serializer', 'deserializer'].forEach(function (name) {
  var source = require('./' + name),
      keys = Object.keys(source),
      total = keys.length,
      key, i;
  for (i = 0; i < total; i++) {
    key = keys[i];
    exports[key] = source[key];
  }
});



/**
 * Decode the given record type.
 *
 * @fixme is this the right place for this method?
 *
 * @param  {String}       type  The record type.
 * @return {Integer|null}       The decoded record type
 */
function decodeRecordType (type) {
  type = type ? type.toLowerCase() : 'd';
  if (type === 'b' || type === 'd' || type === 'f') {
    return type.charCodeAt(0);
  }
  return null;
};

exports.decodeRecordType = decodeRecordType;