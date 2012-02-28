/*------------------------------------------------------------------------------
  (public) readByte
  
  + byte
  - byte representing character code
  
  Parse byte to readable number.
------------------------------------------------------------------------------*/
module.exports.readByte = function(byte) {
	return byte.charCodeAt(0);
};

/*------------------------------------------------------------------------------
  (public) readShort
  
  + bytes
  - string
  
  Parse bytes to readable number.
------------------------------------------------------------------------------*/
module.exports.readShort = function(bytes) {
	return bytes[0] << 8 + bytes[1];
};

/*------------------------------------------------------------------------------
  (public) readInt
  
  + bytes
  - string
  
  Parse bytes to readable number.
------------------------------------------------------------------------------*/
module.exports.readInt = function(buf, offset) {	
	return buf.readUInt32BE(offset);
};

/*------------------------------------------------------------------------------
  (public) readString
  
  + bytes
  - string
  
  Parse bytes to readable number.
------------------------------------------------------------------------------*/
module.exports.readString = function(buf, offset) {
    var length = this.readInt(buf, offset);
    return buf.toString("utf8", offset + 4, offset + 4 + length);
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
