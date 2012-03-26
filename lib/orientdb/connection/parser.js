/*------------------------------------------------------------------------------
  (public) readByte

  + buf
  + offset
  - number

  Read a byte as unsigned integer from the buffer at the given offset.
------------------------------------------------------------------------------*/
var readByte = function(buf, offset) {
    return buf.readUInt8(offset);
};

/*------------------------------------------------------------------------------
  (public) readBytes

  + buf
  + offset
  - number

  Read bytes from the buffer at the given offset.
------------------------------------------------------------------------------*/
var readBytes = function(buf, offset) {
    var length = exports.readInt(buf, offset);
    var new_offset = offset + 4;
    var bytes = new Buffer(length);
    buf.copy(bytes, 0, new_offset, length + new_offset);
    return bytes;
};

/*------------------------------------------------------------------------------
  (public) readShort

  + buf
  - number

  Read a 2-byte signed integer from the buffer at the given offset.
------------------------------------------------------------------------------*/
var readShort = function(buf, offset) {
    return buf.readInt16BE(offset);
};

/*------------------------------------------------------------------------------
  (public) readInt

  + buf
  - number

  Read a 4-byte signed integer from the buffer at the given offset.
------------------------------------------------------------------------------*/
var readInt = function(buf, offset) {
    return buf.readInt32BE(offset);
};

/*------------------------------------------------------------------------------
  (public) readLong

  + buf
  - number

  Read a 8-byte signed integer from the buffer at the given offset.
------------------------------------------------------------------------------*/
var readLong = function(buf, offset) {
    return buf.readInt32BE(offset) * 4294967296 + buf.readUInt32BE(offset + 4);
};

/*------------------------------------------------------------------------------
  (public) readString

  + buf
  - string

  Read a string from the buffer at the given offset.
------------------------------------------------------------------------------*/
var readString = function(buf, offset) {

    var length = readInt(buf, offset);

    if (length > 0) {
        return buf.toString("utf8", offset + 4, offset + 4 + length);
    } else {
        return "";
    }
};

/*------------------------------------------------------------------------------
  (public) readRecord

  + buf
  - record

  Read a record from the buffer at the given offset.
------------------------------------------------------------------------------*/
var readRecord = function(buf, objOffset) {

    var offset = objOffset.offset || objOffset;

    var record = {};

    // record class
    record.class = readShort(buf, offset);
    offset += 2;

    if (record.class == -2) {
        // no record
        record = null;
    } else if (record.class == -3) {
        // rid
        // TODO
        throw new Error("Not implemented!")
    } else if (record.class == -1) {
        // no class id
        // TODO
        throw new Error("And what am I suposed to do here?");
    } else if (record.class > -1) {
        // valid

        // record type ('d' or 'b')
        record.type = String.fromCharCode(readByte(buf, offset));
        offset += 1;

        // cluster ID
        var clusterId = readShort(buf, offset);
        offset += 2;

        if (clusterId != -1) {
            // cluster position
            var clusterPosition = readLong(buf, offset);
            offset += 8;

            record.rid = "#" + clusterId + ":" + clusterPosition;
        } else {
            // jump over the cluster position
            offset += 8;
        }

        // record version
        record.version = readInt(buf, offset);
        offset += 4;

        // serialized record
        record.content = readString(buf, offset);
        offset += record.content.length + 4;

    } else {
        throw new Error("Unknown record class id: " + record.class);
    }

    // save the end offset if we were passed the initial offset in an object
    if (objOffset.offset) {
        objOffset.offset = offset;
    }

    return record;
};


/*------------------------------------------------------------------------------
  (public) readCollection

  + buf
  - collection

  Read a collection from the buffer ar the given offset.
------------------------------------------------------------------------------*/
var readCollection = function(buf, objOffset) {

    var offset = objOffset.offset || objOffset;

    var collection = [];

    // collection size
    var length = readInt(buf, offset);
    offset += 4;

    for (var i = 0; i < length; i++) {

        var recordOffset = { offset: offset };
        var record = readRecord(buf, recordOffset);
        offset = recordOffset.offset;

        // do not add null records
        if (record) {
            collection.push(record);
        }
    }

    // save the end offset if we were passed the initial offset in an object
    if (objOffset.offset) {
        objOffset.offset = offset;
    }

    return collection;
};


var typeOfVar = function(value) {
    var type = toString.call(value).substr(8);
    return type.substr(0, type.length - 1).toLowerCase();
}


var serializeFieldValue = function(type, value) {
    var result = "";
    if (type === "string") {
        if (value.indexOf("#") == 0) {
            result += value;
        } else {
            result += "\"";
            result += value.replace(/\\/, "\\\\").replace(/"/g, "\\\"");
            result += "\"";
        }
    } else if (type === "number") {
        result += value;
        if (value.toString().indexOf(".") !== -1) {
            result += "f";
        }
    } else if (type === "boolean") {
        result += value;
    } else if (type === "date") {
        result += Math.floor(value.getTime() / 1000.0);
        result += "t";
    } else if (type === "object") {
        result += serializeObject(value);
    } else if (type === "array") {
        result += "[";
        for (var i in value) {
            var inner_type = typeOfVar(value[i]);
            if (inner_type === "object") {
              result += "(";
              result += serializeDocument(value[i]);
              result += ")";
            } else {
              result += serializeFieldValue(inner_type, value[i]);
            }
            if (i < value.length - 1) {
              result += ",";
            }
        }  
        result += "]";
    }
    return result;
}


var serializeObject = function(value) {
    var result = "(";
    result += serializeDocument(value);
    result += ")";
    return result;
}


var serializeDocument = function(document) {
    var result = "";
    var _class = "";
    for (var field in document) {
        var value = document[field];
        var type = typeOfVar(value);
        if (field === "@class") {
            _class = value;
        } else {
            result += field;
            result += ":";
            result += serializeFieldValue(type, value);
            result += ",";
        }
    }

    if (_class !== "") {
        result = _class + "@" + result;
    }

    if (result[result.length - 1] === ",") {
        result = result.substr(0, result.length - 1);
    }

    return result;
}


var deserializeDocument = function(serialized, document) {

    serialized = serialized.trim();

    document = document || {};

    var classIndex = serialized.indexOf("@");

    if (classIndex != -1 && serialized.indexOf(":") > classIndex) {
        document["@class"] = serialized.substr(0, classIndex);
        serialized = serialized.substr(classIndex + 1);
    }

    var fieldIndex = -1;

    while ((fieldIndex = serialized.indexOf(":")) != -1) {
        var field = serialized.substr(0, fieldIndex);
        serialized = serialized.substr(fieldIndex + 1);
        var commaIndex = lookForCommaIndex(serialized);
        var value = serialized.substr(0, commaIndex);
        serialized = serialized.substr(commaIndex + 1);
        value = deserializeFieldValue(value, document);
        document[field] = value;
    }

    return document;
}


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
}


var splitValuesFrom = function(value) {
    var result = [];
    while (value.length > 0) {
        var comma_at = lookForCommaIndex(value);
        result.push(value.substr(0, comma_at));
        value = value.substr(comma_at + 1);
    }
    return result;
}


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
}

var oppositeDelimiterOf = function(c) {
    if (c === "[") {
        return "]";
    } else if (c === "{") {
        return "}";
    } else if (c === "(") {
        return ")";
    }
    return "\"";
}

/*------------------------------------------------------------------------------
  (public) writeByte

  + data
  + useBuffer (optional) - when returned value should be a buffer
  - bytes or buffer

  Parse data to 4 bytes which represents integer value.
------------------------------------------------------------------------------*/
var writeByte = function(data, useBuffer) {
    var byte = [data];

    if(useBuffer) {
        return new Buffer(byte);
    } else {
        return byte;
    }
};

/*------------------------------------------------------------------------------
  (public) writeInt

  + data
  - bytes or buffer

  Parse data to 4 bytes which represents integer value.
------------------------------------------------------------------------------*/
var writeInt = function(data) {
    var buf = new Buffer(4);
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
    var buf = new Buffer(8);
    buf.fill(0);

    var high = data / 4294967296;
    high = high > 0 ? Math.floor(high) : Math.ceil(high);
    var low = data % 4294967296;
    buf.writeInt32BE(high, 0);
    buf.writeInt32BE(low, 4);
    return buf;
};

/*------------------------------------------------------------------------------
  (public) writeShort

  + data
  - bytes or buffer

  Parse data to 2 bytes which represents short value.
------------------------------------------------------------------------------*/
var writeShort = function(data) {
    var buf = new Buffer(2);
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
    var buf = new Buffer(4 + length);
    buf.writeInt32BE(length, 0);
    data.copy(buf, 4);
    return buf;
};

/*------------------------------------------------------------------------------
  (public) writeString

  + data
  - buffer

  Parse string data to buffer with UTF-8 encoding.
------------------------------------------------------------------------------*/
var writeString = function(data) {
    var length = data.length;
    var buf = new Buffer(4 + length);
    buf.writeInt32BE(length, 0);
    buf.write(data, 4)
    return buf;
};


/*------------------------------------------------------------------------------
  (public) stringToBytes

  + data
  - buffer

  Converts a string to a buffer, without the length
------------------------------------------------------------------------------*/
var stringToBytes = function(data) {
    var buf = new Buffer(data.length);
    buf.write(data, 0)
    return buf;
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

    var phySegmentFromStream = function(config, values, index) {
        var fileTemplate = { };
        fileTemplate.maxSize = read(values[index++]);
        fileTemplate.fileType = read(values[index++]);
        fileTemplate.fileStartSize = read(values[index++]);
        fileTemplate.fileMaxSize = read(values[index++]);
        fileTemplate.fileIncrementSize = read(values[index++]);
        fileTemplate.defrag = read(values[index++]);

        fileTemplate.infoFiles = [];
        var size = parseInt(read(values[index++]));
        for (var i = 0; i < size; i++) {
            var infoFile = { };
            infoFile.fileName = read(values[index++]);
            infoFile.path = read(values[index++]);
            infoFile.type = read(values[index++]);
            fileTemplate.infoFiles.push(infoFile);
        }

        config.fileTemplate = fileTemplate;

        return index;
    };

    var clustersFromStream = function(config, values, index) {
        config.clusters = [];
        var size = parseInt(read(values[index++]));
        for (var i = 0; i < size; i++) {
            var clusterId = parseInt(read(values[index++]));
            if (clusterId == -1) {
                continue;
            }

            var cluster = { };
            cluster.clusterId = clusterId;
            cluster.clusterName = read(values[index++]);
            cluster.clusterType = read(values[index++]);

            if (cluster.clusterType === "p") {
                index = phySegmentFromStream(cluster, values, index);
                cluster.holeFile = {}
                cluster.holeFile.path = read(values[index++]);
                cluster.holeFile.type = read(values[index++]);
                cluster.holeFile.maxSize = read(values[index++]);
            } else if (cluster.clusterType === "l") {
                cluster.physicalClusterId = parseInt(read(values[index++]));
                cluster.map = read(values[index++]);
            }

            config.clusters.push(cluster);
        }
        return index;
    };

    var dataSegmentsFromStream = function(config, values, index) {
        config.dataSegments = [];
        var size = parseInt(read(values[index++]));
        for (var i = 0; i < size; i++) {
            var dataSegment = { };
            dataSegment.dataId = parseInt(read(values[index++]));
            dataSegment.dataName = read(values[index++]);
            index = phySegmentFromStream(dataSegment, values, index);
            dataSegment.holeFile = {}
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
        index = phySegmentFromStream(config, values, index);
    }
    index = clustersFromStream(config, values, index);
    index = dataSegmentsFromStream(config, values, index);
    config.txSegment = { };
    config.txSegment.path = read(values[index++]);
    config.txSegment.type = read(values[index++]);
    config.txSegment.maxSize = read(values[index++]);
    config.txSegment.synchRecord = read(values[index++]) === "true";
    config.txSegment.synchTx = read(values[index++]) === "true";
    index = propertiesFromStream(config, values, index);

    return config;
};

exports.readByte = readByte;
exports.readBytes = readBytes;
exports.readShort = readShort;
exports.readInt = readInt;
exports.readLong = readLong;
exports.readString = readString;
exports.readRecord = readRecord;
exports.typeOfVar = typeOfVar;
exports.serializeFieldValue = serializeFieldValue;
exports.serializeObject = serializeObject;
exports.serializeDocument = serializeDocument;
exports.deserializeDocument = deserializeDocument;
exports.deserializeFieldValue = deserializeFieldValue;
exports.readCollection = readCollection;
exports.writeByte = writeByte;
exports.writeInt = writeInt
exports.writeLong = writeLong;
exports.writeShort = writeShort;
exports.writeBytes = writeBytes;
exports.writeString = writeString;
exports.stringToBytes = stringToBytes;
exports.parseConfiguration = parseConfiguration;

