/*jshint esversion: 6 */
"use strict";

const varint = require("signed-varint");

const RecordID = require("../../../recordid");
const ORidBag = require("../../../client/database/bag").ORidBag;
const OEmbeddedRidBag = require("../../../client/database/bag").OEmbeddedRidBag;
const OSBTreeRidBag = require("../../../client/database/bag").OSBTreeRidBag;

const BigInteger = require("node-biginteger");
const Long = require("../../../long").Long;

function decimalRead(buffer, scale) {
  var num;
  var bigi;
  if ((buffer[0] & 0x80) === 0) {
    bigi = BigInteger.fromBuffer(1, buffer);
    num = bigi.longValue().toNumber();
  } else {
    for (var cur = 0; cur < buffer.length; cur++) {
      buffer[cur] = buffer[cur] ^ 0xff;
    }
    bigi = BigInteger.fromBuffer(-1, buffer);
    num = bigi.longValue().toNumber();
    // the XOR 0xFF moved the value of 1 unit, change it back
    num -= 1;
  }
  var realScale = 1;
  while (scale > 0) {
    realScale *= 10;
    scale -= 1;
  }
  return num / realScale;
}

function deserialize(type, input, classes) {
  if (!input) {
    return null;
  }
  if (!(input instanceof Buffer)) {
    let err = new Error();
    throw err;
  }

  switch (type) {
    case 4:
      return deserializeProjection(input);
    default:
      return deserializeDocument(input);
  }

  let offset = 0;
  let parsed = parseElement(input, offset);
  let record = parsed.value;

  if (classes && record["@class"] && classes[record["@class"]]) {
    return classes[record["@class"]](record);
  }
  return record;
}
function deserializeProjection(input) {
  let offset = 0;
  let parsed = parseElement(input, offset);
  let record = parsed.value;
  return record;
}
function deserializeDocument(input) {
  let offset = 0;
  let parsed = parseDocument(input, offset);
  let record = parsed.value;
  return record;
}

function parseDocument(input, offset) {
  let record = {};
  let baseOffset = offset;
  let className = parseString(input, offset);
  if (className.value !== "") {
    record["@class"] = className.value;
  }

  offset += className.read;

  let parsed = parseFields(record, input, offset);
  offset += parsed.read;

  return { read: offset - baseOffset, value: record };
}

function parseFields(record, input, offset, reader) {
  let baseOffset = offset;
  let fields = parseNumber(input, offset);
  offset += fields.read;
  for (let i = 0; i < fields.value; i++) {
    let parsed = parseString(input, offset);
    offset = offset + parsed.read;
    let fieldName = parsed.value;
    let type = input.readInt8(offset);
    offset += 1;

    parsed = parseValue(input, type, offset, fieldName, reader);
    offset += parsed.read;
    record[fieldName] = parsed.value;
  }
  return { read: offset - baseOffset };
}
function parseElement(input, offset) {
  let record = {};
  let baseOffset = offset;
  let parsed = parseFields(record, input, offset, parseElement);
  offset += parsed.read;
  parsed = parseString(input, offset);
  offset += parsed.read;
  return { read: offset - baseOffset, value: record };
}
/**
 * Parse single field value
 * @param input Buffer
 * @param type  Field Type
 * @param offset Offset
 * @returns {{offset: number, value: Object}}
 */
function parseValue(input, type, offset, fieldName, reader) {
  let parsed;
  switch (type) {
    case -1:
      parsed = { read: 0, value: null };
      break;
    case 0:
      parsed = parseBoolean(input, offset);
      break;
    case 1:
    case 2:
    case 3:
      parsed = parseNumber(input, offset);
      break;
    case 4:
      parsed = parseFloatNumber(input, offset);
      break;
    case 5:
      parsed = parseDoubleNumber(input, offset);
      break;
    case 6:
      parsed = parseDateTime(input, offset);
      break;
    case 7:
      parsed = parseString(input, offset);
      break;
    case 9:
      parsed = parseEmbedded(input, offset, reader);
      break;
    case 10:
    case 11:
      parsed = parseEmbeddedCollection(input, offset, fieldName, reader);
      break;
    case 12:
      parsed = parseEmbeddedMap(input, offset);
      break;
    case 13:
      parsed = parseLink(input, offset);
      break;
    case 14:
    case 15:
      parsed = parseLinkCollection(input, offset);
      break;
    case 17:
      parsed = parseByte(input, offset);
      break;
    case 19:
      parsed = parseDate(input, offset);
      break;
    case 22:
      parsed = parseRidBag(input, offset);
      break;

    default:
      throw new Error(`Unsupported field type ${type} for field ${fieldName}`);
  }
  return parsed;
}

function parseDateTime(input, offset) {
  let parsed = parseNumber(input, offset);
  parsed.value = new Date(parsed.value);
  return parsed;
}

function parseDate(input, offset) {
  let parsed = parseNumber(input, offset);
  parsed.value = new Date(parsed.value * 86400000);
  return parsed;
}
function parseBoolean(input, offset) {
  let value = input.readInt8(offset);
  return { read: 1, value: value == 1 };
}

function parseByte(input, offset) {
  let value = input.readInt8(offset);
  return { read: 1, value: value };
}
/**
 * Parse LinkList/LinkSet
 * @param input
 * @param offset
 * @returns {{read: number, value: Array}}
 */

function parseLinkCollection(input, offset) {
  let baseOffset = offset;
  let collection = [];
  let size = parseNumber(input, offset);
  offset += size.read;

  for (let i = 0; i < size.value; i++) {
    let ridParsed = parseLink(input, offset);
    offset += ridParsed.read;
    collection.push(ridParsed.value);
  }
  return { read: offset - baseOffset, value: collection };
}

function parseLink(input, offset) {
  let baseOffset = offset;
  let clusterId = parseNumber(input, offset);
  offset += clusterId.read;
  let clusterPosition = parseNumber(input, offset);
  offset += clusterPosition.read;
  let rid = new RecordID({
    cluster: clusterId.value,
    position: clusterPosition.value
  });
  return { read: offset - baseOffset, value: rid };
}

function parseNumber(input, offset) {
  let value = varint.decode(input, offset);
  let read = varint.decode.bytes;
  return { read: read, value: value };
}

function parseFloatNumber(input, offset) {
  let value = input.readFloatBE(offset);
  return { read: 4, value: value };
}
function parseDoubleNumber(input, offset) {
  let value = input.readDoubleBE(offset);
  return { read: 8, value: value };
}

function parseString(input, offset) {
  let parsed = parseNumber(input, offset);
  offset = offset + parsed.read;
  let value = input.toString("utf8", offset, offset + parsed.value);
  return { read: parsed.read + parsed.value, value: value };
}

function parseEmbeddedCollection(input, offset, fieldName, reader) {
  let parsed = parseNumber(input, offset);
  let baseOffset = offset;
  offset += parsed.read;
  let embedded = new Array(parsed.value);

  for (let i = 0; i < parsed.value; i++) {
    let type = input.readInt8(offset);
    offset += 1;
    let tmp;
    if (type === -1) {
      tmp = { read: 0, value: null };
    } else {
      tmp = parseValue(input, type, offset, `${fieldName}[${i}]`, reader);
    }
    offset += tmp.read;
    embedded[i] = tmp.value;
  }
  return { read: offset - baseOffset, value: embedded };
}

function parseEmbedded(input, offset, reader) {
  let parsed;
  if (reader) {
    parsed = reader(input, offset);
  } else {
    parsed = parseDocument(input, offset);
  }
  return parsed;
}
function parseEmbeddedMap(input, offset) {
  let parsed = parseNumber(input, offset);
  let baseOffset = offset;
  offset += parsed.read;
  let map = {};
  for (let i = 0; i < parsed.value; i++) {
    let key = parseString(input, offset);
    offset += key.read;
    let type = input.readInt8(offset);
    offset += 1;
    let tmp;
    if (type === -1) {
      tmp = { read: 0, value: null };
    } else {
      tmp = parseValue(input, type, offset);
    }
    offset += tmp.read;
    map[key.value] = tmp.value;
  }
  return { read: offset - baseOffset, value: map };
}

function parseRidBag(input, offset) {
  let baseOffset = offset;
  let v1 = parseLong(input, offset);
  offset += v1.read;
  let v2 = parseLong(input, offset);
  offset += v2.read;
  let type = parseByte(input, offset);
  offset += type.read;

  // Embedded

  let bag = null;
  if (type.value === 1) {
    bag = new ORidBag(new OEmbeddedRidBag());
    let size = parseNumber(input, offset);
    offset += size.read;
    for (let i = 0; i < size.value; i++) {
      let link = parseLink(input, offset);
      offset += link.read;
      bag.push(link.value);
    }
    // Tree
  } else {
    bag = new ORidBag(new OSBTreeRidBag());
  }

  return { read: offset - baseOffset, value: bag };
}

exports.enableRIDBags = true;
exports.deserialize = deserialize;

/**
 * Read a Long from the given buffer.
 *
 * @param  {Buffer}  buffer The buffer to read from.
 * @param  {Integer} offset The offset to start reading at.
 * @return {Object}         The Long number.
 */

function parseLong(buffer, offset) {
  let long = Long.fromBits(
    buffer.readUInt32BE(offset + 4),
    buffer.readInt32BE(offset)
  );
  return { read: 8, value: long };
}
