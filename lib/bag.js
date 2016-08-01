"use strict";

var RID = require('./recordid'),
    Long = require('./long').Long;

/**
 * # RID Bag
 *
 * A bag of Record IDs, can come in two formats:
 *
 *  * embedded - just a list of record ids.
 *  * tree based - a remote tree based data structure
 *
 * for more details on the RID Bag structure, see https://github.com/orientechnologies/orientdb/wiki/RidBag
 *
 *
 * @param {String} serialized The base64 encoded RID Bag
 */
function Bag (serialized) {
  this.serialized = serialized;
  if(this.serialized){
	this.lazy = true;
  } else {
	this.lazy = false;
  }
  this.uuid = null;
  this._content = [];
  this._buffer = null;
  this._type = null;
  this._offset = 0;
  this._current = -1;
  this._size = null;
  this._prefetchedRecords = null;
}

Bag.BAG_EMBEDDED = 0;
Bag.BAG_TREE = 1;

module.exports = Bag;


Object.defineProperties(Bag.prototype, {
  /**
   * The bag type.
   * @type {String}
   */
  type: {
    get: function () {
      if (this._type === null) {
        this._parse();
      }
      return this._type;
    }
  },
  /**
   * The size of the bag.
   * @type {Integer}
   */
  size: {
    get: function () {
      if (this._size === null) {
        this._parse();
      }
      return this._size;
    }
  }
});


/**
 * Parse the bag content.
 */
Bag.prototype._parse = function () {
  var buffer = new Buffer(this.serialized, 'base64'),
      mode = buffer.readUInt8(0);

  if ((mode & 1) === 1) {
    this._type = Bag.BAG_EMBEDDED;
  }
  else {
    this._type = Bag.BAG_TREE;
  }

  if ((mode & 2) === 2) {
    this.uuid = buffer.slice(1, 16);
    this._offset = 17;
  }
  else {
    this._offset = 1;
  }


  if (this._type === Bag.BAG_EMBEDDED) {
    this._size = buffer.readInt32BE(this._offset);
    this._offset += 4;
  }
  else {
    this._fileId = readLong(buffer, this._offset);
    this._offset += 8;
    this._pageIndex = readLong(buffer, this._offset);
    this._offset += 8;
    this._pageOffset = buffer.readInt32BE(this._offset);
    this._offset += 4;
    this._size = buffer.readInt32BE(this._offset);
    this._offset += 4;
    this._changeSize = buffer.readInt32BE(this._offset);
    this._offset += 4;
  }
  this._buffer = buffer;
};

/**
 * Return a representation of the bag that can be serialized to JSON.
 *
 * @return {Array} The JSON representation of the bag.
 */
Bag.prototype.toJSON = function () {
  if (this.type === Bag.BAG_EMBEDDED) {
    return this.all();
  }
  else {
    return undefined; // because we don't yet know how to serialize a tree bag to JSON.
  }
};

/**
 * Retrieve the next RID in the bag, or null if we're at the end.
 *
 * @return {RID|null} The next Record ID, or null.
 */
Bag.prototype.next = function () {
  var rid;
  if(this.lazy) {
    if (!this._buffer) {
      this._parse();
    }
    if (this._type === Bag.BAG_EMBEDDED) {
      if (this._current >= this._size - 1) {
        return null;
       }
      this._current++;
      rid = this._consume();
      if (this._prefetchedRecords && this._prefetchedRecords[rid]) {
        this._content.push(this._prefetchedRecords[rid]);
      }
      else {
        this._content.push(rid);
      }
      return rid;
    }
  } else {
	this._current++;
	if(this._current > this._content.length){
		this._current = -1;
		return null;
		
	} else {
		return this._content[this._current];
	}

  }
};


/**
 * Retreive all the RIDs in the bag.
 *
 * @return {RID[]} The record ids.
 */
Bag.prototype.all = function () {
  var length = this.length;
  if (this._content.length !== length) {
    while(this.next()); // jshint ignore:line
  }
  if(!this.lazy && this._prefetchedRecords){
      for(var i = 0 ; i < this._content.length ; i ++) {
        if (this._content[i] instanceof RID &&  this._prefetchedRecords[this._content[i]]) {
          this._content[i] = this._prefetchedRecords[this._content[i]];
        }
      }
  }
  return this._content;
};

/**
 * Consume the next RID in the bag.
 *
 * @return {RID|null} The next record id, or null if the bag is exhausted.
 */
Bag.prototype._consume = function () {
  var rid;
  if (this._type === Bag.BAG_EMBEDDED) {
    if (this._offset >= this._buffer.length) {
      return null;
    }
    rid = new RID();
    rid.cluster = this._buffer.readInt16BE(this._offset);
    this._offset += 2;
    rid.position = readLong(this._buffer, this._offset);
    this._offset +=8;
    return rid;
  }
};


/**
 * Read a Long from the given buffer.
 *
 * @param  {Buffer}  buffer The buffer to read from.
 * @param  {Integer} offset The offset to start reading at.
 * @return {Number}         The Long number.
 */
function readLong (buffer, offset) {
  return Long.fromBits(
      buffer.readUInt32BE(offset + 4),
      buffer.readInt32BE(offset)
  ).toNumber();
}
