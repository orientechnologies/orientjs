/*------------------------------------------------------------------------------
  (public) readByte

  + buf
  + offset
  - number

  Read a byte as unsigned integer from the buffer at the given offset.
------------------------------------------------------------------------------*/
exports.readByte = function(buf, offset) {
	return buf.readUInt8(offset);
};

/*------------------------------------------------------------------------------
  (public) readBytes

  + buf
  + offset
  - number

  Read bytes from the buffer at the given offset.
------------------------------------------------------------------------------*/
exports.readBytes = function(buf, offset) {
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
exports.readShort = function(buf, offset) {
	return buf.readInt16BE(offset);
};

/*------------------------------------------------------------------------------
  (public) readInt

  + buf
  - number

  Read a 4-byte signed integer from the buffer at the given offset.
------------------------------------------------------------------------------*/
exports.readInt = function(buf, offset) {	
	return buf.readInt32BE(offset);
};

/*------------------------------------------------------------------------------
  (public) readLong

  + buf
  - number

  Read a 8-byte signed integer from the buffer at the given offset.
------------------------------------------------------------------------------*/
exports.readLong = function(buf, offset) {
	return buf.readInt32BE(offset) * 4294967296 + buf.readUInt32BE(offset + 4);
};

/*------------------------------------------------------------------------------
  (public) readString
  
  + buf
  - string
  
  Read a string from the buffer at the given offset.
------------------------------------------------------------------------------*/
exports.readString = function(buf, offset) {
    var length = this.readInt(buf, offset);
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
exports.readRecord = function(buf, offset) {

    var record = {};

    // record class
    record.class = this.readShort(buf, offset);
    offset += 2;

    if (record.class == -2) {
        // no record
        return null;;
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
        record.type = String.fromCharCode(this.readByte(buf, offset));
        offset += 1;

        // cluster ID
        var clusterId = this.readShort(buf, offset);
        offset += 2;

        if (clusterId != -1) {
            // cluster position
            var clusterPosition = this.readLong(buf, offset);
            offset += 8;

            record.rid = "#" + clusterId + ":" + clusterPosition;
        } else {
            // jump over the cluster position
            offset += 8;
        }

        // record version
        record.version = this.readInt(buf, offset);
        offset += 4;

        // serialized record
        record.content = this.readString(buf, offset);
        offset += record.content.length + 4;

        // TODO improve
        // internal field to get the length outside this function for the next record
        record._end = offset;

    } else {
        throw new Error("Unknown record class id: " + record.class);
    }

    return record;
};


module.exports.type_of = function(value) {
    var type = toString.call(value).substr(8);
    return type.substr(0, type.length - 1).toLowerCase();
}


module.exports.serializeFieldValue = function(type, value) {
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
        result += this.serializeObject(value);
    } else if (type === "array") {
        result += "[";
        for (i in value) {
            var inner_type = this.type_of(value[i]);
            if (inner_type === "object") {
              result += "(";
              result += this.serializeDocument(value[i]);
              result += ")";
            } else {
              result += this.serializeFieldValue(inner_type, value[i]);
            }
            if (i < value.length - 1) {
              result += ",";
            }
        }  
        result += "]";
    }
    return result;
}


module.exports.serializeObject = function(value) {
    var result = "(";
    result += this.serializeDocument(value);
    result += ")";
    return result;
}

module.exports.serializeDocument = function(document) {
    var result = "";
    var _class = "";
    for (field in document) {
        var value = document[field];
        var type = this.type_of(value);
        if (field === "_class") {
            _class = value;
        } else {
            result += field;
            result += ":";
            result += this.serializeFieldValue(type, value);
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


module.exports.deserializeDocument = function(serialized, document) {
    if (typeof document === "undefined") {
        document = {};
    }
    var class_index = serialized.indexOf("@")
    if (class_index != -1 && serialized.indexOf(":") > class_index) {
        document._class = serialized.substr(0, class_index);
        serialized = serialized.substr(class_index + 1);
    }
    var field_index = -1;
    while ((field_index = serialized.indexOf(":")) != -1) {
        var field = serialized.substr(0, field_index);
        serialized = serialized.substr(field_index + 1);
        var comma_index = look_for_comma_index(serialized);
        var value = serialized.substr(0, comma_index);
        serialized = serialized.substr(comma_index + 1);
        value = this.deserializeFieldValue(value, document);
        document[field] = value;
    }
    
    return document;
}

module.exports.deserializeFieldValue = function(value) {
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
        return this.deserializeDocument(value.substr(1, value.length - 2));
    }
    if ("[" === first_char) {
        var values = split_values_from(value.substr(1, value.length - 2));
        for (var i in values) {
            values[i] = this.deserializeFieldValue(values[i]);
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

function split_values_from(value) {
    var result = [];
    while (value.length > 0) {
        var comma_at = look_for_comma_index(value);
        result.push(value.substr(0, comma_at));
        value = value.substr(comma_at + 1);
    }
    return result;
}

function look_for_comma_index(serialized) {
    var inside_value_delimiter = "";
    for (var i = 0; i < serialized.length; i++) {
        var current = serialized[i];
        if (current === "," && inside_value_delimiter === "") {
            return i;
        } else if ((current === "\"" || current === "(" || current === "[" || current === "{") && inside_value_delimiter === "") {
            inside_value_delimiter = current;
        } else if (current !== "\"" && opposite_of(inside_value_delimiter) === current) {
            inside_value_delimiter = "";
        } else if (current === "\"" && inside_value_delimiter === "\"" && i > 0 && serialized[i - 1] !== "\\") {
            inside_value_delimiter = "";
        }
    }
    return serialized.length;
}

function opposite_of(c) {
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
  (public) readCollection
  
  + buf
  - collection
  
  Read a collection from the buffer ar the given offset.
------------------------------------------------------------------------------*/
module.exports.readCollection = function(buf, offset) {

    var collection = [];

    // collection size
    var length = this.readInt(buf, offset);
    offset += 4;

    for (var i = 0; i < length; i++) {

        var record = this.readRecord(buf, offset);

        // do not add null records
        if (record) {
            // TODO improve
            offset = record._end;
            delete record._end;
            collection.push(record);
        } else {
            // null records consume one short with the status
            offset += 2;
        }
    }

    return collection;
};

/*------------------------------------------------------------------------------
  (public) writeByte
  
  + data
  + useBuffer (optional) - when returned value should be a buffer
  - bytes or buffer
  
  Parse data to 4 bytes which represents integer value.
------------------------------------------------------------------------------*/
module.exports.writeByte = function(data, useBuffer) {
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
module.exports.writeInt = function(data) {
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
module.exports.writeLong = function(data) {
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
module.exports.writeShort = function(data) {
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
module.exports.writeBytes = function(data) {
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
module.exports.writeString = function(data) {
    var length = data.length;
    var buf = new Buffer(4 + length);
    buf.writeInt32BE(length, 0);
    buf.write(data, 4)
    return buf;
};

