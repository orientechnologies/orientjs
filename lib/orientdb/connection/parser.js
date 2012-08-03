var BYTES_LONG = 8;
var BYTES_INT = 4;
var BYTES_SHORT = 2;
var BYTES_BYTE = 1;
var REGEXP_RID = /#[\d]+:[\d]+/;

/*------------------------------------------------------------------------------
 (public) readByte

 + buf
 + offset
 - number

 Read a byte as unsigned integer from the buffer at the given offset.
 ------------------------------------------------------------------------------*/
var readByte = function(buf, offset) {
    if (offset + BYTES_BYTE > buf.length) {
        throw new Error(1);
    }

    return buf.readUInt8(offset);
};

var canReadByte = function(buf, offset) {
    return offset + BYTES_BYTE <= buf.length;
};

/*------------------------------------------------------------------------------
 (public) readBytes

 + buf
 + offset
 - number

 Read bytes from the buffer at the given offset.
 ------------------------------------------------------------------------------*/
var readBytes = function(buf, offset) {

    var length = readInt(buf, offset);

    if (offset + BYTES_INT + length > buf.length) {
        throw new Error((offset + BYTES_INT + length) + " > " + buf.length);
    }

    var new_offset = offset + BYTES_INT;
    var bytes = new Buffer(length);
    buf.copy(bytes, 0, new_offset, length + new_offset);
    return bytes;
};

var canReadBytes = function(buf, offset) {
    if (!canReadInt(buf, offset)) {
        return false;
    }
    var length = readInt(buf, offset);
    return (offset + BYTES_INT + length) <= buf.length;
};

/*------------------------------------------------------------------------------
 (public) readShort

 + buf
 - number

 Read a 2-byte signed integer from the buffer at the given offset.
 ------------------------------------------------------------------------------*/
var readShort = function(buf, offset) {

    if (offset + BYTES_SHORT > buf.length) {
        throw new Error(1);
    }

    return buf.readInt16BE(offset);
};

var canReadShort = function(buf, offset) {
    return offset + BYTES_SHORT <= buf.length;
};

/*------------------------------------------------------------------------------
 (public) readInt

 + buf
 - number

 Read a 4-byte signed integer from the buffer at the given offset.
 ------------------------------------------------------------------------------*/
var readInt = function(buf, offset) {

    if (offset + BYTES_INT > buf.length) {
        throw new Error(1);
    }

    return buf.readInt32BE(offset);
};

var canReadInt = function(buf, offset) {
    return offset + BYTES_INT <= buf.length;
};

/*------------------------------------------------------------------------------
 (public) readLong

 + buf
 - number

 Read a 8-byte signed integer from the buffer at the given offset.
 ------------------------------------------------------------------------------*/
var readLong = function(buf, offset) {

    if (offset + BYTES_LONG > buf.length) {
        throw new Error(1);
    }

    return buf.readInt32BE(offset) * 4294967296 + buf.readUInt32BE(offset + BYTES_INT);
};

var canReadLong = function(buf, offset) {
    return offset + BYTES_LONG <= buf.length;
};

/*------------------------------------------------------------------------------
 (public) readString

 + buf
 - string

 Read a string from the buffer at the given offset.

 WARNING: This will succeed even if the buffer does not contain the whole
 string.
 ------------------------------------------------------------------------------*/
var readString = function(buf, offset) {

    var length = readInt(buf, offset);

    if (offset + BYTES_INT + length > buf.length) {
        throw new Error(1);
    }

    offset += BYTES_INT;

    var result = {};
    result.lengthInBytes = length;

    if (length > 0) {
        result.value = buf.toString("utf8", offset, offset + length);
    } else {
        result.value = "";
    }
    return result;
};

var canReadString = function(buf, offset) {
    if (!canReadInt(buf, offset)) {
        return false;
    }
    var length = readInt(buf, offset);
    return offset + BYTES_INT + length <= buf.length;
};

/*------------------------------------------------------------------------------
 (public) readRecord

 + buf
 - record

 Read a record from the buffer at the given offset.
 ------------------------------------------------------------------------------*/
var readRecord = function(buf, objOffset) {

    var offset = objOffset.offset,
        record = {};

    // record class
    if (!canReadShort(buf, offset)) {
        return;
    }
    record["class"] = readShort(buf, offset);
    offset += BYTES_SHORT;

    if (record["class"] === -2) {
        // no record
        record = null;
    } else if (record["class"] === -3) {
        // rid
        // TODO
        throw new Error("Not implemented!")
    } else if (record["class"] === -1) {
        // no class id
        // TODO
        throw new Error("And what am I suposed to do here?");
    } else if (record["class"] > -1) {
        // valid

        // record type ('d' or 'b')
        if (!canReadByte(buf, offset)) {
            return;
        }
        record.type = String.fromCharCode(readByte(buf, offset));
        offset += BYTES_BYTE;

        // cluster ID
        if (!canReadShort(buf, offset)) {
            return;
        }
        var clusterId = readShort(buf, offset);
        offset += BYTES_SHORT;

        if (clusterId !== -1) {
            // cluster position
            if (!canReadLong(buf, offset)) {
                return;
            }
            var clusterPosition = readLong(buf, offset);
            offset += BYTES_LONG;

            record.rid = "#" + clusterId + ":" + clusterPosition;
        } else {
            // jump over the cluster position
            offset += BYTES_LONG;
        }

        // record version
        if (!canReadInt(buf, offset)) {
            return;
        }
        record.version = readInt(buf, offset);
        offset += BYTES_INT;

        // serialized record
        if (!canReadString(buf, offset)) {
            return;
        }
        var readStringContent = readString(buf, offset);
        record.content = readStringContent.value;
        offset += BYTES_INT + readStringContent.lengthInBytes;
    } else {
        throw new Error("Unknown record class id: " + record["class"]);
    }

    // save the end offset if we were passed the initial offset in an object
    objOffset.offset = offset;

    return record;
};


/*------------------------------------------------------------------------------
 (public) readCollection

 + buf
 - collection

 Read a collection from the buffer ar the given offset.
 ------------------------------------------------------------------------------*/
var readCollection = function(buf, info) {

    var offset = info.offset || 0,
        collection = [],
        limit = info.limit,
        recordOffset;

    if (!limit) {
        // collection size
        if (!canReadInt(buf, offset)) {
            return;
        }
        limit = readInt(buf, offset);
        offset += BYTES_INT;
    }

    for (var i = limit; i--;) {
        recordOffset = { offset: offset };

        var record = readRecord(buf, recordOffset);

        // null check is NOT missing
        if (isUndefined(record)) {
            return;
        }

        // do not add null records
        if (record) {
            offset = recordOffset.offset;
            collection.push(record);
        }
    }

    // save the end offset if we were passed the initial offset in an object
    info.offset = offset;
    info.limit = limit;

    return collection;
};


var typeOfVar = function(value) {
    var type = toString.call(value).substr(8);
    return type.substr(0, type.length - 1).toLowerCase();
};


var TYPE_UNDEFINED = typeOfVar(undefined);
var TYPE_NULL = typeOfVar(null);
var TYPE_FUNCTION = typeOfVar(function() {});
var TYPE_STRING = typeOfVar("");
var TYPE_NUMBER = typeOfVar(0);
var TYPE_OBJECT = typeOfVar({});


var isNullOrUndefined = function(value) {
    var type = typeOfVar(value);
    return type === TYPE_NULL || type === TYPE_UNDEFINED;
};


var isUndefined = function(value) {
    return typeOfVar(value) === TYPE_UNDEFINED;
};


var isFunction = function(value) {
    return typeOfVar(value) === TYPE_FUNCTION;
};


var isString = function(value) {
    return typeOfVar(value) === TYPE_STRING;
};


var isNumber = function(value) {
    return typeOfVar(value) === TYPE_NUMBER;
};


var isObject = function(value) {
    return typeOfVar(value) === TYPE_OBJECT;
};


var serializeFieldValue = function(type, value) {
    var result = "";
    if (type === TYPE_STRING) {
        if (REGEXP_RID.test(value)) {
            result = result.concat(value);
        } else {
            result = result.concat("\"", value.replace(/\\/, "\\\\").replace(/"/g, "\\\""), "\"");
        }
    } else if (type === TYPE_NUMBER) {
        result = result.concat(value);
        if (value.toString().indexOf(".") !== -1) {
            result = result.concat("f");
        }
    } else if (type === "boolean") {
        result = result.concat(value);
    } else if (type === "date") {
        result = result.concat(Math.floor(value.getTime() / 1000.0), "t");
    } else if (type === TYPE_OBJECT) {
        result = serializedObject(value);
    } else if (type === "array") {
        result = result.concat("[");
        for (var i in value) {
            var inner_type = typeOfVar(value[i]);
            if (inner_type === TYPE_OBJECT) {
                result = result.concat(serializedObject(value[i]));
            } else {
                result = result.concat(serializeFieldValue(inner_type, value[i]));
            }
            if (i < value.length - 1) {
                result = result.concat(",");
            }
        }
        result = result.concat("]");
    }
    return result;
};

var serializedObject = function(value) {
    if (value["@type"] === "d") {
        return "".concat("(", serializeDocument(value, false), ")");
    }
    return "".concat("{", serializeDocument(value, true), "}");
};


var serializeDocument = function(document, isMap) {
    isMap = isMap || false;
    var result = "";
    var _class = "";
    for (var field in document) {
        if (field === "@version" || field === "@rid" || field === "@type") {
            continue;
        }
        var value = document[field];
        var type = typeOfVar(value);
        if (field === "@class") {
            _class = value;
        } else {
            var fieldWrap = "";
            if (isMap) {
                fieldWrap = "\"";
            }
            result = result.concat(fieldWrap, field, fieldWrap, ":", serializeFieldValue(type, value), ",")
        }
    }

    if (_class !== "") {
        result = _class + "@" + result;
    }

    if (result[result.length - 1] === ",") {
        result = result.substr(0, result.length - 1);
    }

    return result;
};


var deserializeDocument = function(serialized, document, isMap) {

    serialized = serialized.trim();

    document = document || {};

    isMap = isMap || false;

    var classIndex = serialized.indexOf("@");

    if (classIndex !== -1 && serialized.indexOf(":") > classIndex) {
        document["@class"] = serialized.substr(0, classIndex);
        serialized = serialized.substr(classIndex + 1);
    }

    if (!isMap) {
        document["@type"] = "d";
    }

    var fieldIndex;

    while ((fieldIndex = serialized.indexOf(":")) !== -1) {
        var field = serialized.substr(0, fieldIndex);
        serialized = serialized.substr(fieldIndex + 1);
        if (field[0] === "\"" && field[field.length - 1] === "\"") {
            field = field.substring(1, field.length - 1);
        }
        var commaIndex = lookForCommaIndex(serialized);
        var value = serialized.substr(0, commaIndex);
        serialized = serialized.substr(commaIndex + 1);
        value = deserializeFieldValue(value, document);
        document[field] = value;
    }

    return document;
};


var deserializeFieldValue = function(value) {
    if (value === "") {
        return null;
    }
    if (value === "true" || value === "false") {
        return value === "true";
    }

    var first_char = value[0];
    var last_char = value[value.length - 1];

    if ("\"" === first_char) {
        return value.substr(1, value.length - 2).replace(/\\"/g, "\"").replace(/\\\\/, "\\");
    }
    if ("t" === last_char || "a" === last_char) {
        return new Date(parseInt(value.substr(0, value.length - 1)) * 1000);
    }
    if ("(" === first_char) {
        return deserializeDocument(value.substr(1, value.length - 2));
    }
    if ("{" === first_char) {
        return deserializeDocument(value.substr(1, value.length - 2), {}, true);
    }
    if ("[" === first_char) {
        var values = splitValuesFrom(value.substr(1, value.length - 2));
        for (var i in values) {
            values[i] = deserializeFieldValue(values[i]);
        }
        return values;
    }
    if ("b" === last_char) {
        return String.fromCharCode(parseInt(value.substr(0, value.length - 1)));
    }
    if ("l" === last_char || "s" === last_char || "c" === last_char) {
        return parseInt(value.substr(0, value.length - 1));
    }
    if ("f" === last_char || "d" === last_char) {
        return parseFloat(value.substr(0, value.length - 1));
    }
    if (parseInt(value).toString() === value) {
        return parseInt(value);
    }
    return value;
};


var splitValuesFrom = function(value) {
    var result = [];
    while (value.length > 0) {
        var comma_at = lookForCommaIndex(value);
        result.push(value.substr(0, comma_at));
        value = value.substr(comma_at + 1);
    }
    return result;
};


var lookForCommaIndex = function(serialized) {
    var delimiters = [];
    for (var i = 0; i < serialized.length; i++) {
        var current = serialized[i];
        if (current === "," && delimiters.length === 0) {
            return i;
        } else if ((current === "(" || current === "[" || current === "{") && delimiters[delimiters.length - 1] !== "\"") {
            delimiters.push(current);
        } else if ((current === ")" || current === "]" || current === "}") && delimiters[delimiters.length - 1] !== "\"" && current === oppositeDelimiterOf(delimiters[delimiters.length - 1])) {
            delimiters.pop();
        } else if (current === "\"" && delimiters[delimiters.length - 1] === "\"" && i > 0 && serialized[i - 1] !== "\\") {
            delimiters.pop();
        } else if (current === "\"" && delimiters[delimiters.length - 1] !== "\"") {
            delimiters.push(current);
        }
    }
    return serialized.length;
};

var oppositeDelimiterOf = function(c) {
    if (c === "[") {
        return "]";
    } else if (c === "{") {
        return "}";
    } else if (c === "(") {
        return ")";
    }
    return "\"";
};

/*------------------------------------------------------------------------------
 (public) writeByte

 + data
 + useBuffer (optional) - when returned value should be a buffer
 - bytes or buffer

 Parse data to 4 bytes which represents integer value.
 ------------------------------------------------------------------------------*/
var writeByte = function(data, useBuffer) {
    var aByte = [data];

    if (useBuffer) {
        return new Buffer(aByte);
    } else {
        return aByte;
    }
};

/*------------------------------------------------------------------------------
 (public) writeInt

 + data
 - bytes or buffer

 Parse data to 4 bytes which represents integer value.
 ------------------------------------------------------------------------------*/
var writeInt = function(data) {
    var buf = new Buffer(BYTES_INT);
    buf.writeInt32BE(data, 0);
    return buf;
};

/*------------------------------------------------------------------------------
 (public) writeLong

 + data
 - bytes or buffer

 Parse data to 4 bytes which represents integer value.
 ------------------------------------------------------------------------------*/
var writeLong = function(data) {
    var buf = new Buffer(BYTES_LONG);
    buf.fill(0);

    var high = data / 4294967296;
    high = high > 0 ? Math.floor(high) : Math.ceil(high);
    var low = data % 4294967296;
    buf.writeInt32BE(high, 0);
    buf.writeInt32BE(low, BYTES_INT);
    return buf;
};

/*------------------------------------------------------------------------------
 (public) writeShort

 + data
 - bytes or buffer

 Parse data to 2 bytes which represents short value.
 ------------------------------------------------------------------------------*/
var writeShort = function(data) {
    var buf = new Buffer(BYTES_SHORT);
    buf.writeInt16BE(data, 0);
    return buf;
};

/*------------------------------------------------------------------------------
 (public) writeBytes

 + data
 - buffer

 Write byte data to buffer.
 ------------------------------------------------------------------------------*/
var writeBytes = function(data) {
    var length = data.length;
    var buf = new Buffer(BYTES_INT + length);
    buf.writeInt32BE(length, 0);
    data.copy(buf, BYTES_INT);
    return buf;
};

/*------------------------------------------------------------------------------
 (public) writeString

 + data
 - buffer

 Parse string data to buffer with UTF-8 encoding.
 ------------------------------------------------------------------------------*/
var writeString = function(data) {
    if (data === null) {
        return writeInt(-1);
    }

    var stringBuf = stringToBuffer(data);
    var length = stringBuf.length;
    var buf = new Buffer(BYTES_INT + length);
    buf.writeInt32BE(length, 0);
    stringBuf.copy(buf, BYTES_INT, 0, stringBuf.length);
    return buf;
};


/*------------------------------------------------------------------------------
 (public) stringToBytes

 + data
 - buffer

 Converts a string to a buffer, without the length
 ------------------------------------------------------------------------------*/
var stringToBuffer = function(data) {
    return new Buffer(data);
};


// See OStorageConfiguration.fromStream(byte[]) method in the java implementation
var parseConfiguration = function(configString) {
    var values = configString.split("|");

    var read = function(value) {
        if (value === " ") {
            return null;
        }
        return value;
    };

    var phySegmentFromStream = function(config, version, values, index) {
        var fileTemplate = { };
        if (version > 2) {
            fileTemplate.location = read(values[index++]);
        } else {
            fileTemplate.location = null;
        }
        fileTemplate.maxSize = read(values[index++]);
        fileTemplate.fileType = read(values[index++]);
        fileTemplate.fileStartSize = read(values[index++]);
        fileTemplate.fileMaxSize = read(values[index++]);
        fileTemplate.fileIncrementSize = read(values[index++]);
        fileTemplate.defrag = read(values[index++]);

        fileTemplate.infoFiles = [];
        var size = parseInt(read(values[index++]));
        for (var i = 0; i < size; i++) {
            var fileName = read(values[index++]);

            if (fileName.indexOf("$") === -1) {
                // @COMPATIBILITY 0.9.25
                var pos = fileName.indexOf("/databases");
                if (pos > -1) {
                    fileName = "${ORIENTDB_HOME}" + fileName.substring(pos);
                }
            }

            var infoFile = { };
            infoFile.path = fileName;
            infoFile.type = read(values[index++]);
            infoFile.maxSize = read(values[index++]);
            infoFile.incrementSize = fileTemplate.fileIncrementSize;
            fileTemplate.infoFiles.push(infoFile);
        }

        config.fileTemplate = fileTemplate;

        return index;
    };

    var clustersFromStream = function(config, version, values, index) {
        config.clusters = [];
        var size = parseInt(read(values[index++]));
        for (var i = 0; i < size; i++) {
            var clusterId = parseInt(read(values[index++]));
            if (clusterId === -1) {
                continue;
            }

            var cluster = { };
            cluster.clusterId = clusterId;
            cluster.clusterName = read(values[index++]);
            cluster.dataSegmentId = version >= 3 ? parseInt(read(values[index++])) : 0;
            cluster.clusterType = read(values[index++]);
            if (cluster.clusterType === "p") {
                index = phySegmentFromStream(cluster, version, values, index);

                cluster.holeFile = {};
                cluster.holeFile.path = read(values[index++]);
                cluster.holeFile.type = read(values[index++]);
                cluster.holeFile.maxSize = read(values[index++]);
            } else if (cluster.clusterType === "m") {
                //nothing
            } else {
                throw new Error("Unknown cluster type: " + cluster.clusterType);
            }

            config.clusters.push(cluster);
        }
        return index;
    };

    var dataSegmentsFromStream = function(config, version, values, index) {
        config.dataSegments = [];
        var size = parseInt(read(values[index++]));
        for (var i = 0; i < size; i++) {
            var dataSegment = { };
            dataSegment.dataId = parseInt(read(values[index++]));
            dataSegment.dataName = read(values[index++]);
            index = phySegmentFromStream(dataSegment, version, values, index);
            dataSegment.holeFile = {};
            dataSegment.holeFile.path = read(values[index++]);
            dataSegment.holeFile.type = read(values[index++]);
            dataSegment.holeFile.maxSize = read(values[index++]);
            config.dataSegments.push(dataSegment);
        }
        return index;
    };

    var propertiesFromStream = function(config, values, index) {
        config.properties = [];
        var size = parseInt(read(values[index++]));
        for (var i = 0; i < size; i++) {
            var property = { };
            property.name = read(values[index++]);
            property.value = read(values[index++]);
            config.properties.push(property);
        }
        return index;
    };

    var index = 0;
    var config = { };
    config.version = parseInt(read(values[index++]));
    config.name = read(values[index++]);
    config.schemaRecordId = read(values[index++]);
    config.dictionaryRecordId = read(values[index++]);
    if (config.version > 0) {
        config.indexMgrRecordId = read(values[index++]);
    } else {
        config.indexMgrRecordId = null;
    }
    config.localeLanguage = read(values[index++]);
    config.localeCountry = read(values[index++]);
    config.dateFormat = read(values[index++]);
    config.dateTimeFormat = read(values[index++]);
    if (config.version > 1) {
        index = phySegmentFromStream(config, config.version, values, index);
    }
    index = clustersFromStream(config, config.version, values, index);
    index = dataSegmentsFromStream(config, config.version, values, index);
    config.txSegment = { };
    config.txSegment.path = read(values[index++]);
    config.txSegment.type = read(values[index++]);
    config.txSegment.maxSize = read(values[index++]);
    config.txSegment.synchRecord = read(values[index++]) === "true";
    config.txSegment.synchTx = read(values[index++]) === "true";
    index = propertiesFromStream(config, values, index);

    return config;
};

var canParseRid = function(rid) {
    return isString(rid) && REGEXP_RID.test(rid);
};

var parseRid = function(rid) {

    var splits = rid.substr(1).split(":");
    return {
        clusterId: parseInt(splits[0]),
        clusterPosition: parseInt(splits[1])
    };
};

var canReadError = function(buf, offset) {
    if (!canReadByte(buf, offset)) {
        return false;
    }
    var more = readByte(buf, offset);
    offset += BYTES_BYTE;
    while (more) {
        if (!canReadString(buf, offset)) {
            return false;
        }
        var result = readString(buf, offset);
        offset += BYTES_INT + result.lengthInBytes;

        if (!canReadString(buf, offset)) {
            return false;
        }
        result = readString(buf, offset);
        offset += BYTES_INT + result.lengthInBytes;

        if (!canReadByte(buf, offset)) {
            return false;
        }
        more = readByte(buf, offset);
        offset += BYTES_BYTE;
    }
    return true;
};

var readError = function(buf, objOffset) {

    var offset = objOffset.offset;
    var errors = [];

    var more = readByte(buf, offset);
    offset += BYTES_BYTE;
    while (more) {
        var error = {};

        // exception class
        var errorClass = readString(buf, offset);
        error["class"] = errorClass.value;
        offset += BYTES_INT + errorClass.lengthInBytes;

        // exception class
        var errorMessage = readString(buf, offset);
        error.message = errorMessage.value;
        offset += BYTES_INT + errorMessage.lengthInBytes;

        // add to results
        errors.push(error);

        more = readByte(buf, offset);
        offset += BYTES_BYTE;
    }

    // save the end offset if we were passed the initial offset in an object
    objOffset.offset = offset;

    return errors;
};

var mergeHashes = function(destination, source) {
    for (var property in source) {
        if (source.hasOwnProperty(property)) {
            destination[property] = source[property];
        }
    }
    return destination;
};

exports.BYTES_BYTE = BYTES_BYTE;
exports.BYTES_INT = BYTES_INT;
exports.BYTES_LONG = BYTES_LONG;
exports.BYTES_SHORT = BYTES_SHORT;

exports.TYPE_UNDEFINED = TYPE_UNDEFINED;
exports.TYPE_NULL = TYPE_NULL;
exports.TYPE_FUNCTION = TYPE_FUNCTION;
exports.TYPE_STRING = TYPE_STRING;
exports.TYPE_NUMBER = TYPE_NUMBER;
exports.TYPE_OBJECT = TYPE_OBJECT;

exports.isNullOrUndefined = isNullOrUndefined;
exports.isUndefined = isUndefined;
exports.isFunction = isFunction;
exports.isString = isString;
exports.isNumber = isNumber;
exports.isObject = isObject;

exports.readByte = readByte;
exports.canReadByte = canReadByte;

exports.readBytes = readBytes;
exports.canReadBytes = canReadBytes;

exports.readShort = readShort;
exports.canReadShort = canReadShort;

exports.readInt = readInt;
exports.canReadInt = canReadInt;

exports.readLong = readLong;
exports.canReadLong = canReadLong;

exports.readString = readString;
exports.canReadString = canReadString;

exports.readRecord = readRecord;
exports.readCollection = readCollection;

exports.readError = readError;
exports.canReadError = canReadError;

exports.serializeFieldValue = serializeFieldValue;
exports.serializeDocument = serializeDocument;
exports.deserializeDocument = deserializeDocument;
exports.deserializeFieldValue = deserializeFieldValue;
exports.writeByte = writeByte;
exports.writeInt = writeInt;
exports.writeLong = writeLong;
exports.writeShort = writeShort;
exports.writeBytes = writeBytes;
exports.writeString = writeString;
exports.stringToBuffer = stringToBuffer;
exports.parseConfiguration = parseConfiguration;
exports.parseRid = parseRid;
exports.canParseRid = canParseRid;
exports.mergeHashes = mergeHashes;