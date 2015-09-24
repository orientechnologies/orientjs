"use strict";

var constants = require('./constants'),
    utils = require('../../../utils'),
    Long = require('../../../long').Long,
    errors = require('../../../errors'),
    deserializer = require('./deserializer');


/**
 * # Operations
 *
 * The base class for operations, provides a simple DSL for defining
 * the steps required to send a command to the server, and then read
 * the response.
 *
 * Each operation should implement the `writer()` and `reader()` methods.
 *
 * @param {Object} data The data for the operation.
 */
function Operation (data) {
  this.status = Operation.PENDING;
  this.writeOps = [];
  this.readOps = [];
  this.stack = [{}];
  this.data = data || {};
}

module.exports = Operation;

// operation statuses

var statuses = require('../operation-status');

Operation.PENDING = statuses.PENDING;
Operation.WRITTEN = statuses.WRITTEN;
Operation.READING = statuses.READING;
Operation.COMPLETE = statuses.COMPLETE;
Operation.ERROR = statuses.ERROR;
Operation.PUSH_DATA = statuses.PUSH_DATA;

// make it easy to inherit from the base class
Operation.extend = utils.extend;

/**
 * Declares the commands to send to the server.
 * Child classes should implement this function.
 */
Operation.prototype.writer = function () {

};

/**
 * Declares the steps required to recieve data for the operation.
 * Child classes should implement this function.
 */
Operation.prototype.reader = function () {

};

/**
 * Prepare the buffer for the operation.
 *
 * @return {Buffer} The buffer containing the commands to send to the server.
 */
Operation.prototype.buffer = function () {

  if (!this.writeOps.length) {
    this.writer();
  }

  var total = this.writeOps.length,
      size = 0,
      commands = [],
      item, i, fn, offset, data, buffer;

  for (i = 0; i < total; i++) {
    item = this.writeOps[i];
    offset = size;
    commands.push([item[1], offset]);
    size += item[0];
  }

  buffer = new Buffer(size);

  for (i = 0; i < total; i++) {
    item = commands[i];
    fn = item[0];
    offset = item[1];
    fn(buffer, offset);
  }

  return buffer;
};

/**
 * Write a byte.
 *
 * @param  {Mixed} data  The data.
 * @return {Operation}   The operation instance.
 */
Operation.prototype.writeByte = function (data) {
  this.writeOps.push([1, function (buffer, offset) {
    buffer[offset] = data;
  }]);
  return this;
};

/**
 * Write a boolean.
 *
 * @param  {Mixed} data  The data.
 * @return {Operation}   The operation instance.
 */
Operation.prototype.writeBoolean = function (data) {
  this.writeOps.push([1, function (buffer, offset) {
    buffer[offset] = data ? 1 : 0;
  }]);
  return this;
};


/**
 * Write a single character.
 *
 * @param  {Mixed} data  The data.
 * @return {Operation}   The operation instance.
 */
Operation.prototype.writeChar = function (data) {
  this.writeOps.push([1, function (buffer, offset) {
    buffer[offset] = (''+data).charCodeAt(0);
  }]);
  return this;
};

/**
 * Parse data to 4 bytes which represents integer value.
 *
 * @param  {Mixed} data  The data to write.
 * @return {Buffer}      The buffer containing the data.
 */
Operation.prototype.writeInt = function (data) {
  this.writeOps.push([constants.BYTES_INT, function (buffer, offset) {
    buffer.fill(0, offset, offset + constants.BYTES_INT);
    buffer.writeInt32BE(data, offset);
  }]);
  return this;
};

/**
 * Parse data to 8 bytes which represents a long value.
 *
 * @param  {Mixed} data  The data to write.
 * @return {Buffer}      The buffer containing the data.
 */
Operation.prototype.writeLong = function (data) {
  this.writeOps.push([constants.BYTES_LONG, function (buffer, offset) {
    data = Long.fromNumber(data);
    buffer.fill(0, offset, offset + constants.BYTES_LONG);
    buffer.writeInt32BE(data.high_, offset);
    buffer.writeInt32BE(data.low_, offset + constants.BYTES_INT);

  }]);
  return this;
};

/**
 * Parse data to 2 bytes which represents short value.
 *
 * @param  {Mixed} data  The data to write.
 * @return {Buffer}      The buffer containing the data.
 */
Operation.prototype.writeShort = function (data) {
  this.writeOps.push([constants.BYTES_SHORT, function (buffer, offset) {
    buffer.fill(0, offset, offset + constants.BYTES_SHORT);
    buffer.writeInt16BE(data, offset);
  }]);
  return this;
};

/**
 * Write bytes to a buffer
 * @param  {Buffer} data  The data to write.
 * @return {Buffer}      The buffer containing the data.
 */
Operation.prototype.writeBytes = function (data) {
  this.writeOps.push([constants.BYTES_INT + data.length, function (buffer, offset) {
    buffer.writeInt32BE(data.length, offset);
    data.copy(buffer, offset + constants.BYTES_INT);
  }]);
  return this;
};

/**
 * Parse string data to buffer with UTF-8 encoding.
 *
 * @param  {Mixed} data  The data to write.
 * @return {Buffer}      The buffer containing the data.
 */
Operation.prototype.writeString = function (data) {
  if (data == null) {
    return this.writeInt(-1);
  }
  var encoded = encodeString(data),
      length = encoded.length;
  this.writeOps.push([constants.BYTES_INT + length, function (buffer, offset) {
    buffer.writeInt32BE(length, offset);
    encoded.copy(buffer, offset + constants.BYTES_INT);
  }]);
  return this;
};

function encodeString (data) {
  var length = data.length,
      output = new Buffer(length * 3), // worst case, all chars could require 3-byte encodings.
      j = 0, // index output
      i, c;

  for (i = 0; i < length; i++) {
    c = data.charCodeAt(i);
    if (c < 0x80) {
      // 7-bits done in one byte.
      output[j++] = c;
    }
    else if (c < 0x800) {
      // 8-11 bits done in 2 bytes
      output[j++] = (0xC0 | c >> 6);
      output[j++] = (0x80 | c & 0x3F);
    }
    else {
      // 12-16 bits done in 3 bytes
      output[j++] = (0xE0 | c >> 12);
      output[j++] = (0x80 | c >> 6 & 0x3F);
      output[j++] = (0x80 | c & 0x3F);
    }
  }
  return output.slice(0, j);
}

// # Read Operations


/**
 * Read a status from the server response.
 * If the status contains an error, that error
 * will be read instead of any subsequently queued commands.
 *
 * @param  {String}   fieldName  The name of the data field to populate.
 * @param  {Function} reader     The function that should be invoked after this value is read. if any.
 * @return {Operation}           The operation instance.
 */
Operation.prototype.readStatus = function (fieldName, reader) {
  var value = {};
  fieldName = fieldName || 'status';

  this.readOps.push(function (data) {
    data[fieldName] = value;
    this.stack.push(data[fieldName]);
  });
  this.readByte('code');
  this.readInt('sessionId', function (data) {
    if (data.code === 1) {
      this.readError('error', function () {
        if (reader) {
          reader.call(this, value, fieldName);
        }
        this.readOps.push(function () {
          this.stack.pop();
        });
      });
    }
    else {
      if (reader) {
        reader.call(this, value, fieldName);
      }
      this.stack.pop();
    }
  });
  return this;
};

/**
 * Read an error from the server response.
 * Any subsequently queued commands will not run.
 *
 * @param  {String}   fieldName  The name of the data field to populate.
 * @param  {Function} reader     The function that should be invoked after this value is read. if any.
 * @return {Operation}           The operation instance.
 */
Operation.prototype.readError = function (fieldName, reader) {
  this.readOps = [['Error', [fieldName, reader]]];
  return this;
};

/**
 * Read an object from the server response.
 * This is the same as `readString` but deserializes the returned string
 * into an object.
 *
 * @param  {String}   fieldName  The name of the data field to populate.
 * @param  {Function} reader     The function that should be invoked after this value is read. if any.
 * @return {Operation}           The operation instance.
 */
Operation.prototype.readObject = function (fieldName, reader) {
  this.readOps.push(['String', [fieldName, function (data, fieldName) {
    data[fieldName] = deserializer.deserialize(data[fieldName], this.data.transformerFunctions);
    if (reader) {
      reader.call(this, data, fieldName);
    }
  }]]);
  return this;
};


// Add the `readByte`, `readInt` etc methods.
// these are just shortcuts

[
  'Byte',
  'Bytes',
  'Int',
  'Short',
  'Long',
  'String',
  'Array',
  'Record',
  'Char',
  'Boolean',
  'Collection'
]
.forEach(function (name) {
  this['read' + name] = function (fieldName, reader) {
    this.readOps.push([name, arguments]);
    return this;
  };
}, Operation.prototype);


/**
 * Consume the buffer starting from the given offset.
 * Returns an array containing the operation status, the
 * new offset and any collected result.
 *
 * If the buffer doesn't contain enough data for the operation
 * to complete, it will process as much as possible and return
 * a partial result with a status code of `Operation.READING` meaning
 * that the operation is still in the reading state.
 *
 * If the operation completes successfully, the status code will be
 * `Operation.COMPLETE`.
 *
 *
 * @param  {Buffer} buffer  The buffer to read from.
 * @param  {Integer} offset The offset
 * @return {Array}          The array containing the status, new offset and result.
 */
Operation.prototype.consume = function (buffer, offset) {
  var obj, code, context, item, type, args;
  offset = offset || 0;
  if (this.status === Operation.PENDING) {
    // this is the first time consume has been called for this
    // operation. We need to determine whether the response
    // we're reading is really for us or whether it's a
    // PUSH_DATA command.
    if (buffer.length < offset + 1) {
      // not enough bytes in the buffer to check.
      return [Operation.READING, offset, {}];
    }

    code = buffer.readUInt8(offset);
    if (code === 3) {
      offset += 5; // ignore the next integer
      obj = {};
      offset += this.parsePushedData(buffer, offset, obj, 'data');
      return [Operation.PUSH_DATA, offset, obj.data];
    }

    this.status = Operation.READING;
  }
  if (this.readOps.length === 0) {
    return [Operation.COMPLETE, offset, this.stack[0]];
  }
  while ((item = this.readOps.shift())) {
    context = this.stack[this.stack.length - 1];
    if (typeof item === 'function') {
      // this is a nop, just execute it.
      item.call(this, context, buffer, offset);
      continue;
    }
    type = item[0];
    args = item[1];
    if (!this.canRead(type, buffer, offset)) {
      // not enough bytes in the buffer, operation is still reading.
      this.readOps.unshift(item);
      return [Operation.READING, offset, this.stack[0]];
    }
    offset += this['parse' + type](buffer, offset, context, args[0], args[1]);
  }
  if (this.stack[0] && this.stack[0].status && this.stack[0].status.code) {
    return [Operation.ERROR, offset, this.stack[0]];
  }
  else {
    return [Operation.COMPLETE, offset, this.stack[0]];
  }
};

/**
 * Defetermine whether the operation can read a value of the given
 * type from the buffer at the given offset.
 *
 * @param  {String} type    The value type.
 * @param  {Buffer} buffer  The buffer to read from.
 * @param  {Integer} offset The offset to start reading at.
 * @return {Boolean}        true if the value can be read.
 */
Operation.prototype.canRead = function (type, buffer, offset) {
  var length = buffer.length;
  if (offset > length) {
    return false;
  }
  switch (type) {
    case 'Array':
    case 'Error':
      return true;
    case 'Byte':
    case 'Char':
    case 'Boolean':
      return length >= offset + 1;
    case 'Short':
    case 'Record':
      return length >= offset + constants.BYTES_SHORT;
    case 'Long':
      return length >= offset + constants.BYTES_LONG;
    case 'Int':
    case 'Collection':
      return length >= offset + constants.BYTES_INT;
    case 'Bytes':
    case 'String':
      if (length <= offset + constants.BYTES_INT) {
        return false;
      }
      else {
        return length >= offset + constants.BYTES_INT + buffer.readInt32BE(offset);
      }
      break;
    default:
      return false;
  }
};


/**
 * Parse a byte from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseByte = function (buffer, offset, context, fieldName, reader) {
  context[fieldName] = buffer.readUInt8(offset);
  if (reader) {
    reader.call(this, context, fieldName);
  }
  return 1;
};

/**
 * Parse a character from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseChar = function (buffer, offset, context, fieldName, reader) {
  context[fieldName] = String.fromCharCode(buffer.readUInt8(offset));
  if (reader) {
    reader.call(this, context, fieldName);
  }
  return 1;
};

/**
 * Parse a boolean from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseBoolean = function (buffer, offset, context, fieldName, reader) {
  context[fieldName] = Boolean(buffer.readUInt8(offset));
  if (reader) {
    reader.call(this, context, fieldName);
  }
  return 1;
};


/**
 * Parse a short from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseShort = function (buffer, offset, context, fieldName, reader) {

  context[fieldName] = buffer.readInt16BE(offset);
  if (reader) {
    reader.call(this, context, fieldName);
  }
  return constants.BYTES_SHORT;
};

/**
 * Parse an integer from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseInt = function (buffer, offset, context, fieldName, reader) {
  context[fieldName] = buffer.readInt32BE(offset);
  if (reader) {
    reader.call(this, context, fieldName);
  }
  return constants.BYTES_INT;
};

/**
 * Parse a long from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseLong = function (buffer, offset, context, fieldName, reader) {
  context[fieldName] = Long
  .fromBits(
    buffer.readUInt32BE(offset + constants.BYTES_INT),
    buffer.readInt32BE(offset)
  )
  .toNumber();

  if (reader) {
    reader.call(this, context, fieldName);
  }
  return constants.BYTES_LONG;
};

/**
 * Parse some bytes from the given buffer at the given offset and
 * insert them into the context under the given field name.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseBytes = function (buffer, offset, context, fieldName, reader) {
  var length = buffer.readInt32BE(offset);
  offset += constants.BYTES_INT;
  if (length < 0) {
    context[fieldName] = null;
  }
  else {
    context[fieldName] = buffer.slice(offset, offset + length);
  }
  if (reader) {
    reader.call(this, context, fieldName);
  }
  return length > 0 ? length + constants.BYTES_INT : constants.BYTES_INT;
};


/**
 * Parse a string from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseString = function (buffer, offset, context, fieldName, reader) {
  var length = buffer.readInt32BE(offset);
  offset += constants.BYTES_INT;
  if (length < 0) {
    context[fieldName] = null;
  }
  else {
    context[fieldName] = buffer.toString('utf8', offset, offset + length);
  }
  if (reader) {
    reader.call(this, context, fieldName);
  }
  return length > 0 ? length + constants.BYTES_INT : constants.BYTES_INT;
};

/**
 * Parse a record from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseRecord = function (buffer, offset, context, fieldName, reader) {
  var remainingOps = this.readOps,
      record = {};
  this.readOps = [];
  this.stack.push(record);
  if (Array.isArray(context[fieldName])) {
    context[fieldName].push(record);
  }
  else {
    context[fieldName] = record;
  }
  this.readShort('classId', function (record, fieldName) {
    if (record[fieldName] === -1) {
      record.value = new errors.Protocol('No class for record, cannot proceed.');
      this.stack.pop();
      this.readOps.push(function () {
        if (reader) {
          reader.call(this, context, fieldName);
        }
      });
      this.readOps.push.apply(this.readOps, remainingOps);
      return;
    }
    else if (record[fieldName] === -2) {
      record.value = null;
      this.stack.pop();
      this.readOps.push(function () {
        if (reader) {
          reader.call(this, context, fieldName);
        }
      });
      this.readOps.push.apply(this.readOps, remainingOps);
      return;
    }
    else if (record[fieldName] === -3) {
      record.type = 'd';
      this
      .readShort('cluster')
      .readLong('position')
      .readOps.push(function () {
        this.stack.pop();
        this.readOps.push(function () {
          if (reader) {
            reader.call(this, context, fieldName);
          }
        });
        this.readOps.push.apply(this.readOps, remainingOps);
      });
    }
    else if (record[fieldName] > -1) {
      this
      .readChar('type')
      .readShort('cluster')
      .readLong('position')
      .readInt('version')
      .readString('value', function (data, key) {
        data[key] = deserializer.deserialize(data[key], this.data.transformerFunctions);
        this.stack.pop();
        this.readOps.push(function () {
          if (reader) {
            reader.call(this, context, fieldName);
          }
        });
        this.readOps.push.apply(this.readOps, remainingOps);
      });
    }
  });



  return 0;
};


/**
 * Parse a collection from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseCollection = function (buffer, offset, context, fieldName, reader) {
  var remainingOps = this.readOps,
      records = [],
      total = buffer.readInt32BE(offset),
      i;
  offset += 4;
  this.readOps = [];
  context[fieldName] = records;
  for (i = 0; i < total; i++) {
    this.readRecord(fieldName);
  }
  if (reader) {
    this.readOps.push(function () {
      reader.call(this, records);
    });
  }
  this.readOps.push.apply(this.readOps, remainingOps);
  return 4;
};


/**
 * Parse an array from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * > Note. this differs from the other `parseXYZ` methods in that `reader`
 * is required, and MUST return an array of functions. Each function in the
 * array represents a 'scope' for an item in the array and will be invoked in order.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseArray = function (buffer, offset, context, fieldName, reader) {
  var items = reader.call(this, context),
      remainingOps = this.readOps;

  this.readOps = [];

  context[fieldName] = [];
  this.stack.push(context[fieldName]);

  items.map(function (item) {
    var childContext = {};
    context[fieldName].push(childContext);
    this.readOps.push(function () {
      this.stack.push(childContext);
    });

    item.call(this, childContext);

    this.readOps.push(function () {
      this.stack.pop();
    });
  }, this);


  this.readOps.push(function () {
    this.stack.pop();
  });

  this.readOps.push.apply(this.readOps, remainingOps);
  return 0;
};

/**
 * Parse an error from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 * > Note: this implementation differs from the others in that
 * when an error is encountered, any subsequent `readXYZ()` commands
 * that were due to be run will be skipped.
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parseError = function (buffer, offset, context, fieldName, reader) {
  var err = new errors.Request();
  err.previous = [];
  // remove any ops we were expecting to run.
  this.readOps = [];

  context[fieldName] = err;
  this.stack.push(err);
  this.readByte('id');


  function readItem () {
    this.readString('type');
    this.readString('message');
    this.readByte('hasMore', function (data) {
      var prev;
      if (data.hasMore) {
        prev = new errors.Request();
	prev.type = data.type;
	prev.message = data.message;
        err.previous.push(prev);
        this.stack.pop();
        this.stack.push(prev);
        readItem.call(this);
      }
      else {
	err.type = data.type;
	err.message = data.message;
        this.readBytes('javaStackTrace', function (data) {
          this.readOps.push(function (data) {
            this.stack.pop();
          });
        });
      }
    });
  }
  readItem.call(this);
  if (reader) {
    reader.call(this, context, fieldName);
  }
  return 0;
};


/**
 * Parse any pushed data from the given buffer at the given offset and
 * insert it into the context under the given field name.
 *
 *
 * @param  {Buffer} buffer     The buffer to read from.
 * @param  {Integer} offset    The offset to start reading from.
 * @param  {Object} context    The context to add the value to.
 * @param  {String} fieldName  The name of the field in the context.
 * @param  {Function} reader   The function that should be invoked after the value is read, if any.
 * @return {Integer}           The number of bytes read.
 */
Operation.prototype.parsePushedData = function (buffer, offset, context, fieldName, reader) {
  var length = buffer.readInt32BE(offset),
      asString;
  offset += constants.BYTES_INT;
  asString = buffer.toString('utf8', offset, offset + length);
  switch (asString.charAt(0)) {
    case 'R':
      context[fieldName] = deserializer.deserialize(asString.slice(1), this.data.transformerFunctions);
      break;
    default:
      console.log('unsupported pushed data format: ' + asString);
  }
  if (reader) {
    reader.call(this, context, fieldName);
  }
  return length + constants.BYTES_INT;
};

