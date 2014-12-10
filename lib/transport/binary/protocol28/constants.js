"use strict";

exports.PROTOCOL_VERSION = 28;

exports.BYTES_LONG = 8;
exports.BYTES_INT = 4;
exports.BYTES_SHORT = 2;
exports.BYTES_BYTE = 1;

exports.RECORD_TYPES = {
  'd': 100,
  'b': 98,
  'f': 102,

  // duplicated as upper case for fast lookup

  'D': 100,
  'B': 98,
  'F': 102,
};