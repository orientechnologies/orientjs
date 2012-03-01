/*------------------------------------------------------------------------------
  (public) readByte
  
  + byte
  - byte representing character code
  
  Parse byte to readable number.
------------------------------------------------------------------------------*/
module.exports.readByte = function(buf, offset) {
	return buf.readUInt8(offset);
};

/*------------------------------------------------------------------------------
  (public) readShort
  
  + bytes
  - number
  
  Parse bytes at the given offset as a 2 byte number.
------------------------------------------------------------------------------*/
module.exports.readShort = function(buf, offset) {
	return buf.readUInt16BE(offset);
};

/*------------------------------------------------------------------------------
  (public) readInt
  
  + bytes
  - number
  
  Parse bytes at the given offset as a 4 byte number.
------------------------------------------------------------------------------*/
module.exports.readInt = function(buf, offset) {	
	return buf.readUInt32BE(offset);
};

/*------------------------------------------------------------------------------
  (public) readLong
  
  + bytes
  - number
  
  Parse bytes at the given offset as a 8 byte number.
------------------------------------------------------------------------------*/
module.exports.readLong = function(buf, offset) {	
	return buf.readUInt32BE(offset) * 256 + buf.readUInt32BE(offset + 4);
};

/*------------------------------------------------------------------------------
  (public) readString
  
  + bytes
  - string
  
  Parse bytes to string.
------------------------------------------------------------------------------*/
module.exports.readString = function(buf, offset) {
    var length = this.readInt(buf, offset);
    return buf.toString("utf8", offset + 4, offset + 4 + length);
};

/*------------------------------------------------------------------------------
  (public) readRecord
  
  + bytes
  - record
  
  Parse bytes to record.
------------------------------------------------------------------------------*/
module.exports.readRecord = function(buf, offset) {

    var record = {};

    record.type = String.fromCharCode(this.readByte(buf, offset));
    offset += 1;

    var clusterId = this.readShort(buf, offset);
    offset += 2;
    var clusterPosition = this.readLong(buf, offset);
    offset += 8;
    record.rid = "#" + clusterId + ":" + clusterPosition;

    record.version = this.readInt(buf, offset);
    offset += 4;

    record.content = this.readString(buf, offset);
    offset += record.content.length + 4;

    // TODO improve
    // internal field to get the length outside this function for the next record
    record._end = offset;

    return record;
};

/*------------------------------------------------------------------------------
  (public) readCollection
  
  + bytes
  - collection
  
  Parse bytes to collection.
------------------------------------------------------------------------------*/
module.exports.readCollection = function(buf, offset) {

    var collection = [];

    var length = this.readInt(buf, offset);
    offset += 4;

    for (var i = 0; i < length; i++) {

        var record = {};
        record.class = this.readShort(buf, offset);
        offset += 2;

        if (record.class == -2) {
            // no record
            continue;
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
            var record = this.readRecord(buf, offset);
            offset = record._end;
            delete record._end;
            collection.push(record);
        } else {
            throw new Error("Unknown record class id: " + record.class);
        }
    }

    debugger;
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

