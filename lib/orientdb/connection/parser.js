"use strict";

var _			= require("lodash");
var Long		= require("./long").Long;

var BYTES_LONG	= 8;
var BYTES_INT	= 4;
var BYTES_SHORT	= 2;
var BYTES_BYTE	= 1;
var REGEXP_RID	= /^#\-{0,1}[\d]+:\-{0,1}[\d]+$/;

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

    var newOffset	= offset + BYTES_INT;
    var bytes		= new Buffer(length);
    buf.copy(bytes, 0, newOffset, length + newOffset);
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

    return Long.fromBits(buf.readUInt32BE(offset + BYTES_INT), buf.readInt32BE(offset)).toNumber();
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
        result.lengthInBytes = 0;
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
        record.type = "d";
        // cluster ID
        if (!canReadShort(buf, offset)) {
            return;
        }
        var clusterId = readShort(buf, offset);
        offset += BYTES_SHORT;

        // cluster position
        if (!canReadLong(buf, offset)) {
            return;
        }
        var clusterPosition = readLong(buf, offset);
        offset += BYTES_LONG;

        record.rid = toRid(clusterId, clusterPosition);
    } else if (record["class"] === -1) {
        // no class id
        // TODO
        throw new Error("And what am I supposed to do here?");
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

            record.rid = toRid(clusterId, clusterPosition);
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

    for (var idx = limit; idx--;) {
        recordOffset = { offset: offset };

        var record = readRecord(buf, recordOffset);

        // null check is NOT missing
        if (_.isUndefined(record)) {
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

var isNullOrUndefined = function(value) {
    return _.isNull(value) || _.isUndefined(value);
};

var serializeFieldValue = function(value) {
    var result = "";
    if (_.isString(value)) {
        result = result.concat("\"", value.replace(/\\/, "\\\\").replace(/"/g, "\\\""), "\"");
    } else if (_.isNumber(value)) {
        result = result.concat(value);
        if (value.toString().indexOf(".") !== -1) {
            result = result.concat("f");
        }
    } else if (_.isBoolean(value)) {
        result = result.concat(value);
    } else if (_.isDate(value)) {
        result = result.concat(value.getTime(), "t");
    } else if (_.isArray(value)) {
        result = result.concat("[");
        for (var idx = 0, length = value.length; idx < length; idx++) {
            if (_.isObject(value[idx])) {
                result = result.concat(serializedObject(value[idx]));
            } else {
                result = result.concat(serializeFieldValue(value[idx]));
            }
            if (idx < value.length - 1) {
                result = result.concat(",");
            }
        }
        result = result.concat("]");
    } else if (_.isObject(value)) {
        result = serializedObject(value);
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
    isMap		= isMap || false;
    var result	= '';
    var clazz	= '';

    for(var field in document) {
        if (field === "@version" || field === "@rid" || field === "@type") {
            continue;
        }

        var value	= document[field];

		if (field === "@class") {
            clazz	= value;
        } else {
            var fieldWrap = "";
            if (isMap) {
                fieldWrap = "\"";
            }
            result = result.concat(fieldWrap, field, fieldWrap, ":", serializeFieldValue(value), ",");
        }
    }

    if (clazz !== '') {
        result	= clazz + '@' + result;
    }

    if (result[result.length - 1] === ',') {
        result	= result.substr(0, result.length - 1);
    }

    return result;
};


var deserializeDocument = function(serialized, document, isMap) {

    serialized = serialized.trim();

    document = document || {};

    isMap = isMap || false;

    var classIndex = serialized.indexOf("@");

    var indexOfColon = serialized.indexOf(":");
    if (classIndex !== -1 && (indexOfColon > classIndex || indexOfColon === -1)) {
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
        if (field.charAt(0) === "\"" && field[field.length - 1] === "\"") {
            field = field.substring(1, field.length - 1);
        }
        var commaIndex = lookForCommaIndex(serialized);
        var value = serialized.substr(0, commaIndex);
        serialized = serialized.substr(commaIndex + 1);
        value = deserializeFieldValue(value);
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

    var firstChar = value.charAt(0);
    var lastChar = value[value.length - 1];

    if ("\"" === firstChar) {
        return value.substr(1, value.length - 2).replace(/\\"/g, "\"").replace(/\\\\/, "\\");
    }
    if ("t" === lastChar || "a" === lastChar) {
        return new Date(parseInt(value.substr(0, value.length - 1)));
    }
    if ("(" === firstChar) {
        return deserializeDocument(value.substr(1, value.length - 2));
    }
    if ("{" === firstChar) {
        return deserializeDocument(value.substr(1, value.length - 2), {}, true);
    }
    if ("[" === firstChar || "<" === firstChar) { //process Set <...> like List [...]
        var values = splitValuesFrom(value.substr(1, value.length - 2));
        for (var idx = 0, length = values.length; idx < length; idx++) {
            values[idx] = deserializeFieldValue(values[idx]);
        }
        return values;
    }
    if ("b" === lastChar) {
        return String.fromCharCode(parseInt(value.substr(0, value.length - 1)));
    }
    if ("l" === lastChar || "s" === lastChar || "c" === lastChar) {
        return parseInt(value.substr(0, value.length - 1));
    }
    if ("f" === lastChar || "d" === lastChar) {
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
        var commaAt = lookForCommaIndex(value);
        result.push(value.substr(0, commaAt));
        value = value.substr(commaAt + 1);
    }
    return result;
};


var lookForCommaIndex = function(serialized) {
    var delimiters = [];
    for (var idx = 0, length = serialized.length; idx < length; idx++) {
        var current = serialized[idx];
        if (current === "," && delimiters.length === 0) {
            return idx;
        } else if (isStartDelimiter(current) && delimiters[delimiters.length - 1] !== "\"") {
            delimiters.push(current);
        } else if (isEndDelimiter(current) && delimiters[delimiters.length - 1] !== "\"" && current === oppositeDelimiterOf(delimiters[delimiters.length - 1])) {
            delimiters.pop();
        } else if (current === "\"" && delimiters[delimiters.length - 1] === "\"" && idx > 0 && serialized[idx - 1] !== "\\") {
            delimiters.pop();
        } else if (current === "\"" && delimiters[delimiters.length - 1] !== "\"") {
            delimiters.push(current);
        }
    }
    return serialized.length;
};

var isStartDelimiter = function(c) {
    return c === "(" || c === "[" || c === "{" || c === "<";
};

var isEndDelimiter = function(c) {
    return c === ")" || c === "]" || c === "}" || c === ">";
};

var oppositeDelimiterOf = function(c) {
    if (c === "[") {
        return "]";
    } else if (c === "{") {
        return "}";
    } else if (c === "(") {
        return ")";
    } else if (c === "<") {
        return ">";
    }
    return "\"";
};


var deserializeORID = function(ORID) {
    if (ORID["@type"] !== "b") {
        throw new Error("Expected a BINARY document");
    }

    var buf = ORID.data;
    var offset = 0;

    var treeSize = readInt(buf, offset);
    offset += BYTES_INT;
    var nodeSize = readInt(buf, offset);
    offset += BYTES_INT;

    offset += BYTES_BYTE + (BYTES_SHORT + BYTES_LONG); //ignoring color and parent rid

    var leftRidClusterId = readShort(buf, offset);
    offset += BYTES_SHORT;
    var leftRidClusterPosition = readLong(buf, offset);
    offset += BYTES_LONG;
    var leftRid;
    if (leftRidClusterId !== -1 && leftRidClusterPosition !== -1) {
        leftRid = toRid(leftRidClusterId, leftRidClusterPosition);
    }

    var rightRidClusterId = readShort(buf, offset);
    offset += BYTES_SHORT;
    var rightRidClusterPosition = readLong(buf, offset);
    offset += BYTES_LONG;
    var rightRid;
    if (rightRidClusterId !== -1 && rightRidClusterPosition !== -1) {
        rightRid = toRid(rightRidClusterId, rightRidClusterPosition);
    }

    var clusterId = -1;
    var clusterPosition = -1;
    var rids = [];
    for (var idx = 0; idx < nodeSize; idx++) {
        clusterId = readShort(buf, offset);
        offset += BYTES_SHORT;
        clusterPosition = readLong(buf, offset);
        offset += BYTES_LONG;
        rids.push(toRid(clusterId, clusterPosition));
    }

    return {
        treeSize: treeSize,
        leftRid: leftRid,
        rightRid: rightRid,
        rids: rids
    };
};


var pushArray = function(targetArray, dataArray) {
    targetArray.push.apply(targetArray, dataArray);
};

/*------------------------------------------------------------------------------
 (public) writeByte

 + data
 - bytes or buffer

 Parse data to 4 bytes which represents integer value.
 ------------------------------------------------------------------------------*/
var writeByte = function(data) {
    return new Buffer([data]);
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

    var long = Long.fromNumber(data);

    buf.writeInt32BE(long.high_, 0);
    buf.writeInt32BE(long.low_, BYTES_INT);

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
	console.log('writeBytes', data.toString())
    var length	= data.length;
    var buf		= new Buffer(BYTES_INT + length);
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

    var stringBuf	= stringToBuffer(data);
    var length		= stringBuf.length;
    var buf			= new Buffer(BYTES_INT + length);
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
    var values	= configString.split("|");
    var read	= function(value) {
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
        for (var idx = 0; idx < size; idx++) {
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
        for (var idx = 0; idx < size; idx++) {
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

                var holeFlag;
                if (version > 4) {
                    holeFlag = read(values[index++]);
                } else {
                    holeFlag = "f";
                }

                if (holeFlag === "f") {
                    cluster.holeFile = {};
                    cluster.holeFile.path = read(values[index++]);
                    cluster.holeFile.type = read(values[index++]);
                    cluster.holeFile.maxSize = read(values[index++]);
                }
            } else if (cluster.clusterType === "m") {
                // nothing
            } else if (cluster.clusterType === "h") {
                // nothing
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
        for (var idx = 0; idx < size; idx++) {
            var dataId = parseInt(read(values[index++]));
            if (dataId === -1) {
                continue;
            }
            var dataSegment = { };
            dataSegment.dataId = dataId;
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
        for (var idx = 0; idx < size; idx++) {
            var property = { };
            property.name = read(values[index++]);
            property.value = read(values[index++]);
            config.properties.push(property);
        }
        return index;
    };

    var index					= 0;
    var config					= {};
    config.version				= parseInt(read(values[index++]));
    config.name					= read(values[index++]);
    config.schemaRecordId		= read(values[index++]);
    config.dictionaryRecordId	= read(values[index++]);

    if (config.version > 0) {
        config.indexMgrRecordId	= read(values[index++]);
    } else {
        config.indexMgrRecordId	= null;
    }

    config.localeLanguage = read(values[index++]);
    config.localeCountry = read(values[index++]);
    config.dateFormat = read(values[index++]);
    config.dateTimeFormat = read(values[index++]);
    if (config.version >= 4) {
        config.timeZone = read(values[index++]);
        config.charset = read(values[index++]);
    }
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
    return _.isString(rid) && REGEXP_RID.test(rid);
};

var parseRid = function(rid) {
	var clusterId, clusterPosition;

	if(_.isObject(rid)) {
		clusterId		= rid.clusterId;
		clusterPosition	= rid.clusterPosition;
	} else if(!canParseRid(rid)) {
		return {};
	} else {
		rid			= rid.replace('#', '');
		var splits	= rid.split(':');

		if(splits.length != 2) {
			return {};
		}

		clusterId		= parseInt(splits[0]);
		clusterPosition	= parseInt(splits[1]);
	}

	return {
        clusterId:clusterId,
		clusterPosition:clusterPosition,
		recordId:'#'+clusterId+':'+clusterPosition
    };
};

var toRid = function(clusterId, clusterPosition) {
    return "#" + clusterId + ":" + clusterPosition;
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
    var offset	= objOffset.offset;
    var errors	= [];

    var more	= readByte(buf, offset);
    offset		+= BYTES_BYTE;

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


var hashToSQLSets = function(hash) {
    if(_.isEmpty(hash)) {
        return {
            sqlsets: "",
            remainingHash: {}
        };
    }

    var remainingHash = {};
    var sql = "SET ";
    for (var field in hash) {
        var value = hash[field];
        if (_.isBoolean(value) || _.isNumber(value) || _.isString(value) || _.isDate(value)) {
            if (_.isString(value)) {
                value = "\"".concat(value.replace(/"/g, "\\\""), "\"");
            } else if (_.isDate(value)) {
                value = "date(\"" + value.toISOString() + "\", \"yyyy-MM-dd'T'HH:mm:ss.SSS'Z'\")";
            }
            sql = sql.concat(field, " = ", value, ", ");
        } else {
            remainingHash[field] = value;
        }
    }
    // if nothing was added to the SET return empty string otherwise remove the last comma
    sql = sql === "SET " ? "" : sql.substring(0, sql.length - 2);

    return {
        sqlsets: sql,
        remainingHash: remainingHash
    };
};


var deepClone = function(obj) {
    if(_.isFunction(obj) || _.isRegExp(obj)) {
        return obj;
    }

    if(_.isDate(obj)) {
        return new Date(obj);
    }

    if(_.isObject(obj)) {
        var newObj	= _.clone(obj);

        for (var field in newObj) {
            newObj[field] = deepClone(newObj[field]);
        }

        return newObj;
    }

    return obj;
};

var decodeRecordType = function(type) {
    type = type ? type.toLowerCase() : 'd';

    if (type === 'b' || type === 'd' || type === 'f') {
        return type.charCodeAt(0);
    }

    return null;
};

function encodeRecordData(data) {
	var list	= [];
	var content	= data.content;

	for(var k in content) {
		var obj		= content[k];
		var item	= k+':';

		if(_.isString(obj)) {
			item	+= '"' + addcslashes(obj, '"\\') + '"';
		} else {
			item	+= obj;
		}

		list.push(item);
	}

	var str	= '';

	if(data['@class'] && data['@class'] !== '') {
		str	+= data.class+'@';
	}

	str		+= list.join(', ');
	var buf	= new Buffer(str, 'utf8');

	return buf;
}

function addcslashes(str, charlist) {
	// From: http://phpjs.org/functions
	// +   original by: Brett Zamir (http://brett-zamir.me)
	// %  note 1: We show double backslashes in the return value example code below because a JavaScript string will not
	// %  note 1: render them as backslashes otherwise
	// *     example 1: addcslashes('foo[ ]', 'A..z'); // Escape all ASCII within capital A to lower z range, including square brackets
	// *     returns 1: "\\f\\o\\o\\[ \\]"
	// *     example 2: addcslashes("zoo['.']", 'z..A'); // Only escape z, period, and A here since not a lower-to-higher range
	// *     returns 2: "\\zoo['\\.']"
	// *     example 3: addcslashes("@a\u0000\u0010\u00A9", "\0..\37!@\177..\377"); // Escape as octals those specified and less than 32 (0x20) or greater than 126 (0x7E), but not otherwise
	// *     returns 3: '\\@a\\000\\020\\302\\251'
	// *     example 4: addcslashes("\u0020\u007E", "\40..\175"); // Those between 32 (0x20 or 040) and 126 (0x7E or 0176) decimal value will be backslashed if specified (not octalized)
	// *     returns 4: '\\ ~'
	// *     example 5: addcslashes("\r\u0007\n", '\0..\37'); // Recognize C escape sequences if specified
	// *     returns 5: "\\r\\a\\n"
	// *     example 6: addcslashes("\r\u0007\n", '\0'); // Do not recognize C escape sequences if not specified
	// *     returns 6: "\r\u0007\n"
	var target = '',
		chrs = [],
		i = 0,
		j = 0,
		c = '',
		next = '',
		rangeBegin = '',
		rangeEnd = '',
		chr = '',
		begin = 0,
		end = 0,
		octalLength = 0,
		postOctalPos = 0,
		cca = 0,
		escHexGrp = [],
		encoded = '',
		percentHex = /%([\dA-Fa-f]+)/g;
	var _pad = function (n, c) {
		if ((n = n + '').length < c) {
			return new Array(++c - n.length).join('0') + n;
		}
		return n;
	};

	for (i = 0; i < charlist.length; i++) {
		c = charlist.charAt(i);
		next = charlist.charAt(i + 1);
		if (c === '\\' && next && (/\d/).test(next)) { // Octal
			rangeBegin = charlist.slice(i + 1).match(/^\d+/)[0];
			octalLength = rangeBegin.length;
			postOctalPos = i + octalLength + 1;
			if (charlist.charAt(postOctalPos) + charlist.charAt(postOctalPos + 1) === '..') { // Octal begins range
				begin = rangeBegin.charCodeAt(0);
				if ((/\\\d/).test(charlist.charAt(postOctalPos + 2) + charlist.charAt(postOctalPos + 3))) { // Range ends with octal
					rangeEnd = charlist.slice(postOctalPos + 3).match(/^\d+/)[0];
					i += 1; // Skip range end backslash
				} else if (charlist.charAt(postOctalPos + 2)) { // Range ends with character
					rangeEnd = charlist.charAt(postOctalPos + 2);
				} else {
					throw 'Range with no end point';
				}
				end = rangeEnd.charCodeAt(0);
				if (end > begin) { // Treat as a range
					for (j = begin; j <= end; j++) {
						chrs.push(String.fromCharCode(j));
					}
				} else { // Supposed to treat period, begin and end as individual characters only, not a range
					chrs.push('.', rangeBegin, rangeEnd);
				}
				i += rangeEnd.length + 2; // Skip dots and range end (already skipped range end backslash if present)
			} else { // Octal is by itself
				chr = String.fromCharCode(parseInt(rangeBegin, 8));
				chrs.push(chr);
			}
			i += octalLength; // Skip range begin
		} else if (next + charlist.charAt(i + 2) === '..') { // Character begins range
			rangeBegin = c;
			begin = rangeBegin.charCodeAt(0);
			if ((/\\\d/).test(charlist.charAt(i + 3) + charlist.charAt(i + 4))) { // Range ends with octal
				rangeEnd = charlist.slice(i + 4).match(/^\d+/)[0];
				i += 1; // Skip range end backslash
			} else if (charlist.charAt(i + 3)) { // Range ends with character
				rangeEnd = charlist.charAt(i + 3);
			} else {
				throw 'Range with no end point';
			}
			end = rangeEnd.charCodeAt(0);
			if (end > begin) { // Treat as a range
				for (j = begin; j <= end; j++) {
					chrs.push(String.fromCharCode(j));
				}
			} else { // Supposed to treat period, begin and end as individual characters only, not a range
				chrs.push('.', rangeBegin, rangeEnd);
			}
			i += rangeEnd.length + 2; // Skip dots and range end (already skipped range end backslash if present)
		} else { // Character is by itself
			chrs.push(c);
		}
	}

	for (i = 0; i < str.length; i++) {
		c = str.charAt(i);
		if (chrs.indexOf(c) !== -1) {
			target += '\\';
			cca = c.charCodeAt(0);
			if (cca < 32 || cca > 126) { // Needs special escaping
				switch (c) {
					case '\n':
						target += 'n';
						break;
					case '\t':
						target += 't';
						break;
					case '\u000D':
						target += 'r';
						break;
					case '\u0007':
						target += 'a';
						break;
					case '\v':
						target += 'v';
						break;
					case '\b':
						target += 'b';
						break;
					case '\f':
						target += 'f';
						break;
					default:
						//target += _pad(cca.toString(8), 3);break; // Sufficient for UTF-16
						encoded = encodeURIComponent(c);

						// 3-length-padded UTF-8 octets
						if ((escHexGrp = percentHex.exec(encoded)) !== null) {
							target += _pad(parseInt(escHexGrp[1], 16).toString(8), 3); // already added a slash above
						}
						while ((escHexGrp = percentHex.exec(encoded)) !== null) {
							target += '\\' + _pad(parseInt(escHexGrp[1], 16).toString(8), 3);
						}
						break;
				}
			} else { // Perform regular backslashed escaping
				target += c;
			}
		} else { // Just add the character unescaped
			target += c;
		}
	}
	return target;
}

exports.BYTES_BYTE	= BYTES_BYTE;
exports.BYTES_INT	= BYTES_INT;
exports.BYTES_LONG	= BYTES_LONG;
exports.BYTES_SHORT	= BYTES_SHORT;

exports.isNullOrUndefined = isNullOrUndefined;

exports.readByte		= readByte;
exports.canReadByte		= canReadByte;
exports.writeByte		= writeByte;
exports.readBoolean		= readByte;
exports.canReadBoolean	= canReadByte;
exports.writeBoolean	= writeByte;

exports.readBytes		= readBytes;
exports.canReadBytes	= canReadBytes;
exports.writeBytes		= writeBytes;

exports.readShort		= readShort;
exports.canReadShort	= canReadShort;
exports.writeShort		= writeShort;

exports.readInt = readInt;
exports.canReadInt = canReadInt;
exports.writeInt = writeInt;

exports.readLong = readLong;
exports.canReadLong = canReadLong;
exports.writeLong = writeLong;

exports.readString = readString;
exports.canReadString = canReadString;
exports.writeString = writeString;

exports.readRecord = readRecord;
exports.readCollection = readCollection;

exports.readError = readError;
exports.canReadError = canReadError;

exports.parseRid = parseRid;
exports.toRid = toRid;
exports.canParseRid = canParseRid;

exports.serializeFieldValue	= serializeFieldValue;
exports.serializeDocument	= serializeDocument;
exports.deserializeDocument	= deserializeDocument;
exports.deserializeFieldValue = deserializeFieldValue;
exports.deserializeORID		= deserializeORID;
exports.stringToBuffer		= stringToBuffer;
exports.parseConfiguration	= parseConfiguration;
exports.pushArray			= pushArray;
exports.hashToSQLSets		= hashToSQLSets;
exports.deepClone			= deepClone;

exports.decodeRecordType	= decodeRecordType;
exports.encodeRecordData	= encodeRecordData;