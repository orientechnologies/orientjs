var Promise = require('bluebird'),
    Operation = require('./operation'),
    operations = require('./operations'),
    Emitter = require('events').EventEmitter,
    errors = require('../errors'),
    util = require('util');

function OperationQueue (socket) {
  this.socket = socket || null;
  this.items = [];
  this.remaining = null;
  if (socket) this.bindToSocket();
  Emitter.call(this);
}

util.inherits(OperationQueue, Emitter);

module.exports = OperationQueue;

/**
 * Add an operation to the queue.
 *
 * @param   {String|Operation} op The operation name or instance.
 * @param   {Object} params       The parameters for the operation, if op is a string.
 * @promise {Object}              The result of the operation.
 */
OperationQueue.prototype.add = function (op, params) {
  if (typeof op === 'string') {
    op = new operations[op](params || {});
  }
  var deferred = Promise.defer(),
      buffer;
  // define the write operations
  op.writer();
  // define the read operations
  op.reader();
  buffer = op.buffer();
  this.socket.write(buffer);
  if (op.id === 'REQUEST_DB_CLOSE') {
    deferred.resolve({});
  }
  else {
    this.items.push([op, deferred]);
  }
  return deferred.promise;
};

/**
 * Cancel all the operations in the queue.
 *
 * @param  {Error} err      The error object, if any.
 * @return {OperationQueue} The now empty queue.
 */
OperationQueue.prototype.cancel = function (err) {
  var item, op, deferred;
  while (item = this.items.shift()) {
    op = item[0];
    deferred = item[1];
    deferred.reject(err);
  }
  return this;
};

/**
 * Bind to events on the socket.
 */
OperationQueue.prototype.bindToSocket = function (socket) {
  if (socket)
    this.socket = socket;
  this.socket.on('data', this.handleChunk.bind(this));
};

/**
 * Handle a chunk of data from the socket and attempt to process it.
 *
 * @param  {Buffer} data The data received from the server.
 */
OperationQueue.prototype.handleChunk = function (data) {
  var buffer, result, offset;
  if (this.remaining) {
    buffer = new Buffer(this.remaining.length + data.length);
    this.remaining.copy(buffer);
    data.copy(buffer, this.remaining.length);
  }
  else {
    buffer = data;
  }
  offset = this.process(buffer);
  if (buffer.length - offset === 0) {
    this.remaining = null;
  }
  else {
    this.remaining = buffer.slice(offset);
  }
};

/**
 * Process the operations in the queue against the given buffer.
 *
 *
 * @param  {Buffer}  buffer The buffer to process.
 * @param  {Integer} offset The offset to start processing from, defaults to 0.
 * @return {Integer}        The offset that was successfully read up to.
 */
OperationQueue.prototype.process = function (buffer, offset) {
  var code, parsed, result, status, item, op, deferred;
  offset = offset || 0;
  while (item = this.items.shift()) {
    op = item[0];
    deferred = item[1];
    parsed = op.consume(buffer, offset);
    status = parsed[0];
    offset = parsed[1];
    result = parsed[2];
    if (status === Operation.READING) {
      // operation is incomplete, buffer does not contain enough data
      this.items.unshift(item);
      return offset;
    }
    else if (status === Operation.PUSH_DATA) {
      this.emit('update-config', result);
      this.items.unshift(item);
      return offset;
    }
    else if (status === Operation.COMPLETE) {
      deferred.resolve(result);
    }
    else if (status === Operation.ERROR) {
      deferred.reject(result.status.error || new errors.Operation('Unknown Error'));
    }
    else
      deferred.reject(new errors.Protocol('Unsupported operation status: ' + status));
  }
  return offset;
};