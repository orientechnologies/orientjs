/*jshint esversion: 6 */
"use strict";

const Promise = require('bluebird');
const Operation = require('./operation');

const npmPackage = require('../../../../package.json');
const constants = require('./constants');
exports.Operation = Operation;
exports.OperationQueue = require('./operation-queue');
exports.constants = constants;
exports.serializer = require('./serializer');
exports.deserializer = require('./deserializer');
exports.operations = require('./operations');

/**
 * Handshaking function for 37
 * @param network
 * @returns {Promise}
 */
exports.handshake = (network) => {


  return new Promise((resolve, reject) => {
    let operation = new Operation();
    let buffer = operation
      .writeByte(20)
      .writeShort(+constants.PROTOCOL_VERSION)
      .writeString(npmPackage.name)
      .writeString(npmPackage.version)
      .buffer();
    network.socket.write(buffer);
    resolve(network);
  });
};