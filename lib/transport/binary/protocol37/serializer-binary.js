/*jshint esversion: 6 */
"use strict";

const Operation = require('./operation');

const RID = require('../../../recordid');
const RawExpression = require('../../../db/statement').RawExpression;


function serializeDocument(doc, op) {
  let operation = op || new Operation();
  let className = doc["@class"] || "";
  operation.writeVarintString(className);
  writeObject(operation, doc);
  return operation.buffer();
}
exports.serializeDocument = serializeDocument;

function writeObject(operation, doc) {
  let fields = Object.keys(doc).filter((f) => {
    return f !== "@class" && f !== "@rid";
  });
  operation.writeVarint(fields.length);

  fields.forEach((f) => {
    operation.writeVarintString(f);
    writeValue(operation, doc[f]);
  });
}

function writeValue(op, value) {

  switch (typeof value) {
    case 'string' :
      op.writeByte(7);
      op.writeVarintString(value);
      break;
    case 'object':
      if (Array.isArray(value)) {
        handleArray(op, value);
      } else {
        handleObject(op, value);
      }
      break;
    case 'function':
      // TODO Handle Function?
      break;
    case 'number' :
      op.writeByte(3);
      op.writeVarint(value);
      break;
    default:
      throw new Error(`Unsupported type ${value}`);
  }
}

function writeLink(op, link) {
  op.writeVarint(link.cluster);
  op.writeVarint(link.position);
}


function handleObject(op, value) {
  if (value instanceof RawExpression) {
    writeValue(op, value.toString());
  } else if (value instanceof RID) {
    op.writeByte(13);
    writeLink(op, value);
  } else if (value instanceof Date) {
    op.writeByte(6);
    op.writeVarint(value.getTime());
  } else if (value["@class"]) {
    // write embedded
    op.writeByte(9);
    serializeDocument(value, op);
  } else {
    // write map
    op.writeByte(12);
    writeObject(op, value);
  }
}


function handleEmbeddedCollection(op, value) {
  op.writeByte(10);
  op.writeVarint(value.length);
  value.forEach((val) => {
    writeValue(op, val);
  });
}

function handleLinkList(op, value) {
  op.writeByte(14);
  op.writeVarint(value.length);
  value.forEach((val) => {
    writeLink(op, val);
  });
}
function handleArray(op, value) {

  let handler = handleEmbeddedCollection;
  if (value.length > 0) {
    if (value[0] instanceof RID) {
      handler = handleLinkList;
    }
  }
  handler(op, value);
}

