"use strict";

var net = require('net'),
  util = require('util'),
  utils = require('../../utils'),
  errors = require('../../errors'),
  OperationStatus = require('./operation-status'),
  EventEmitter = require('events').EventEmitter,
  Promise = require('bluebird'),
  Operation;


function Connection(config) {
  EventEmitter.call(this);
  config = config || {};
  this.host = config.host || 'localhost';
  this.port = +config.port || 2424;
  this.socket = null;
  this.logger = config.logger || {
      debug: function () {
      }
    };
  this.setMaxListeners(Infinity);


  this.enableRIDBags = config.enableRIDBags == null ? true : config.enableRIDBags;
  this.closing = false;
  this.reconnectNow = false;
  this.protocol = null;
  this.queue = [];
  this.writes = [];
  this.remaining = null;
}

util.inherits(Connection, EventEmitter);

module.exports = Connection;

/**
 * Connect to the server.
 *
 * @promise {Connection} The connection instance.
 */
Connection.prototype.connect = function () {
  if (this.connecting) {
    return this.connecting;
  }
  else if (this.socket) {
    return Promise.resolve(this);
  }

  this.socket = this.createSocket();
  return (this.connecting = this.negotiateConnection());
};

/**
 * Send an operation to the server.
 *
 * @param   {String|Operation} op The operation name or instance.
 * @param   {Object} params       The parameters for the operation, if op is a string.
 * @promise {Object}              The result of the operation.
 */
Connection.prototype.send = function (op, params) {
  if (this.connecting) {
    return this.connecting.then(this._sendOp.bind(this, op, params));
  }
  else if (this.socket) {
    return this._sendOp(op, params);
  }
  else {
    return this.connect().then(this._sendOp.bind(this, op, params));
  }
};

/**
 * Send an operation to the server.
 *
 * @param   {String|Operation} op The operation name or instance.
 * @param   {Object} params       The parameters for the operation, if op is a string.
 * @promise {Object}              The result of the operation.
 */
Connection.prototype._sendOp = function (op, params) {
  var self = this;
  return new Promise(function (resolve, reject) {
    if (typeof op === 'string') {
      op = new self.protocol.operations[op](params || {});
    }
    // define the write operations
    op.writer();
    // define the read operations
    op.reader();

    var buffer = op.buffer();
    if (op.id === 'REQUEST_DB_CLOSE') {
      self.reconnectNow = true;
      self.socket.write(buffer, resolve);
      return;
    }
    else if (self.socket) {
      self.socket.write(buffer);
    }
    else {
      self.writes.push(buffer);
    }

    self.queue.push([op, {resolve: resolve, reject: reject}]);
  });
};

/**
 * Cancel all the operations in the queue.
 *
 * @param  {Error} err      The error object, if any.
 * @return {Connection}     The connection instance.
 */
Connection.prototype.cancel = function (err) {
  var item, op;
  while ((item = this.queue.shift())) {
    op = item[0];
    item[1].reject(err);
  }
  return this;
};


/**
 * Create a socket that can connect to the orientdb server.
 *
 * @return {Socket} The socket.
 */
Connection.prototype.createSocket = function () {
  var socket = net.createConnection(this.port, this.host);
  socket.setNoDelay(true);
  socket.setMaxListeners(100);
  return socket;
};

/**
 * Close the socket.
 *
 * @return {Connection} The now closed connection.
 */
Connection.prototype.close = function () {
  if (this.socket) {
    // to avoid hangup of process we need to destroy socket completely.
    this.socket.removeAllListeners();
    this.socket.destroy();
    this.socket = null;
  }
  return this;
};

/**
 * Negotiate a connection to the server.
 *
 * @promise {Connection} The connection instance.
 */
Connection.prototype.negotiateConnection = function () {
  return new Promise(function (resolve, reject) {
    this.logger.debug('negotiating connection to ' + this.host + ':' + this.port);
    this.socket.once('connect', function () {
      this.logger.debug('connected to ' + this.host + ':' + this.port);
      this.socket.removeAllListeners();
      this.negotiateProtocol(this.socket).done(resolve, reject);
    }.bind(this));

    this.socket.once('error', function (err) {
      this.logger.debug('connection error during negotiation: ' + err);
      this.socket.removeAllListeners();
      this.connecting = false;
      reject(new errors.Connection(err.code, err.message));
    }.bind(this));

    this.socket.once('close', function (err) {
      this.logger.debug('connection closed during negotiation: ' + err);
      this.socket.removeAllListeners();
      this.connecting = false;
      if (err) {
        reject(new errors.Connection(err.code, err.message));
      }
      else {
        reject(new errors.Connection(0, 'Socket Closed'));
      }
    }.bind(this));

  }.bind(this));
};

/**
 * Negotiate the orientdb server protocol.
 *
 * @promise {Connection} The connection instance.
 */
Connection.prototype.negotiateProtocol = function () {
  return new Promise(function (resolve, reject) {
    this.socket.once('data', function (data) {
      this.socket.removeAllListeners('error');
      this.protocolVersion = data.readUInt16BE(0);
      this.logger.debug('server protocol: ' + this.protocolVersion);
      if (this.protocolVersion >= 33) {
        this.protocol = require('./protocol33');
      } else if (this.protocolVersion >= 28) {
        this.protocol = require('./protocol28');
      }
      else if (this.protocolVersion === 26) {
        this.protocol = require('./protocol26');
      }
      else {
        this.protocol = require('./protocol19');
      }
      this.protocol.deserializer.enableRIDBags = this.enableRIDBags;
      resolve(this);
      this.connecting = false;
      this.bindToSocket();
      this.emit('connect');

      if (data.length > 2) {
        process.nextTick(function () {
          var remainingData = new Buffer(data.length - 2);
          data.copy(remainingData, 0, 2);
          if (remainingData.length) {
            this.handleSocketData(remainingData);
          }
        }.bind(this));
      }
      if (this.writes.length) {
        process.nextTick(function () {
          var total = this.writes.length,
            i;
          for (i = 0; i < total; i++) {
            this.socket.write(this.writes[i]);
          }
          this.writes = [];
        }.bind(this));
      }
    }.bind(this));
    this.socket.once('error', function (err) {
      this.connecting = false;
      this.logger.debug('error in protocol negotiation: ' + err);
      this.socket.removeAllListeners();
      reject(new errors.Connection(err.code, err.message));
    }.bind(this));
    this.socket.once('close', function (err) {
      this.logger.debug('connection closed during protocol negotiation: ' + err);
      if (this.socket) {
        this.socket.removeAllListeners(); // close earlier could have destroyed & set socket to null.
      }
      this.connecting = false;
      if (err) {
        reject(new errors.Connection(err.code, err.message));
      }
      else {
        reject(new errors.Connection(0, 'Socket Closed'));
      }
    }.bind(this));
  }.bind(this));
};


/**
 * Bind to events on the socket.
 */
Connection.prototype.bindToSocket = function () {
  this.socket.on('data', this.handleSocketData.bind(this));
  this.socket.on('error', this.handleSocketError.bind(this));
  this.socket.on('close', this.handleSocketClose.bind(this));
  this.socket.on('end', this.handleSocketEnd.bind(this));
};


/**
 * Handle a chunk of data from the socket and attempt to process it.
 *
 * @param  {Buffer} data The data received from the server.
 */
Connection.prototype.handleSocketData = function (data) {
  var buffer, result, offset, processed, lastOp;
  if (this.remaining) {


    buffer = new Buffer(this.remaining.length + data.length);
    this.remaining.copy(buffer);
    data.copy(buffer, this.remaining.length);
  }
  else {

    buffer = data;
  }

  processed = this.process(buffer);
  offset = processed[0];
  lastOp = processed[1];
  if (buffer.length - offset === 0) {
    this.remaining = null;
  }
  else {
    this.remaining = buffer.slice(offset);
    // TODO refactor. In case of pending buffers but not Reading the precess should continue on the remaining Buffer
    if (lastOp != OperationStatus.READING) {
      this.handleSocketData(new Buffer(0));
    }
  }
};

/**
 * Handle a socket error event.
 *
 * @param  {Error} err The error object.
 */
Connection.prototype.handleSocketError = function (err) {
  err = new errors.Connection(2, err ? (err.message || err) : 'Socket Error.');
  this.cancel(err);
  this.destroySocket();
  this.emit('error', err);
};

/**
 * Handle a socket end event.
 *
 * @param  {Error} err The error object, if any.
 */
Connection.prototype.handleSocketEnd = function (err) {
  if (this.reconnectNow) {
    this.reconnectNow = false;
    this.destroySocket();
    this.emit('reconnectNow');
    return;
  }
  if (this.closing) {
    this.closing = false;
    this.destroySocket();
    this.emit('close');
    return;
  }
  err = new errors.Connection(1, err || 'Remote server closed the connection.');

  this.cancel(err);

  this.destroySocket();
  this.emit('error', err);
};

/**
 * Handle a socket close event.
 *
 * @param  {Error} err The error object, if any.
 */
Connection.prototype.handleSocketClose = function (err) {
  this.cancel(new errors.Connection(3, err || 'Connection Closed.'));
  this.destroySocket();
  this.emit('close');
};

/**
 * Unbind from the socket events and destroy it.
 */
Connection.prototype.destroySocket = function () {
  this.socket.removeAllListeners();
  delete this.socket;
  this.connecting = false;
};

/**
 * Process the operations in the queue against the given buffer.
 *
 *
 * @param  {Buffer}  buffer The buffer to process.
 * @param  {Integer} offset The offset to start processing from, defaults to 0.
 * @return {Array}        The offset that was successfully read up to.
 */
Connection.prototype.process = function (buffer, offset) {
  var code, parsed, result, status, item, op, deferred, err, token, operation;
  offset = offset || 0;
  if (this.queue.length === 0) {
    if (!Operation) {
      Operation = require('./protocol' + this.protocol.constants.PROTOCOL_VERSION + '/operation');
    }
    op = new Operation();
    parsed = op.consume(buffer, offset);
    status = parsed[0];
    if (status === OperationStatus.PUSH_DATA) {
      offset = parsed[1];
      result = parsed[2];
      this.emit('update-config', result);
      return [offset,status];
    } else if (status === OperationStatus.LIVE_RESULT) {
      token = parsed[1];
      operation = parsed[2];
      result = parsed[3];
      offset = parsed[4];
      this.emit('live-query-result', token, operation, result);
      return [offset, status];
    }
  }

  while ((item = this.queue.shift())) {
    op = item[0];
    deferred = item[1];
    parsed = op.consume(buffer, offset);
    status = parsed[0];
    offset = parsed[1];
    result = parsed[2];
    if (status === OperationStatus.READING) {
      // operation is incomplete, buffer does not contain enough data
      this.queue.unshift(item);
      return [offset, status];
    }
    else if (status === OperationStatus.PUSH_DATA) {
      this.emit('update-config', result);
      this.queue.unshift(item);
      //return offset;
    }
    else if (status === OperationStatus.COMPLETE) {
      deferred.resolve(result);
    } else if (status === OperationStatus.LIVE_RESULT) {
      token = parsed[1];
      operation = parsed[2];
      result = parsed[3];
      offset = parsed[4];
      this.emit('live-query-result', token, operation, result);
      this.queue.unshift(item);
      //return offset;
    }
    else if (status === OperationStatus.ERROR) {
      if (result.status.error) {
        // this is likely a recoverable error
        deferred.reject(result.status.error);
      }
      else {
        // cannot recover, reject everything and let the application decide what to do
        err = new errors.Protocol('Unknown Error on operation id ' + op.id, result);
        deferred.reject(err);
        this.cancel(err);
        this.emit('error', err);
      }
    }
    else {
      deferred.reject(new errors.Protocol('Unsupported operation status: ' + status));
    }
  }
  return [offset, status];
};
