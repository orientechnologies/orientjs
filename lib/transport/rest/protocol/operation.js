"use strict";

var utils = require('../../../utils');

/**
 * # REST Operations
 *
 * The base class for REST operations, provides a simple DSL for defining
 * the steps required to send a command to the server, and then read
 * the response.
 *
 * Each operation should implement the `write()` and `read()` methods.
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


Operation.PENDING = 0;
Operation.WRITTEN = 1;
Operation.READING = 2;
Operation.COMPLETE = 3;
Operation.ERROR = 4;
Operation.PUSH_DATA = 5;

// make it easy to inherit from the base class
Operation.extend = utils.extend;

