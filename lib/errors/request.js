/*jshint esversion: 6 */
"use strict";

var OperationError = require("./operation");

module.exports = OperationError.inherit(function RequestError(message, data) {
  this.name = "OrientDB.RequestError";
  this.message = message;
  this.data = data || {};
  this.isMVCC = () => {
    return (
      this.code === 3 ||
      this.type ===
        "com.orientechnologies.orient.core.exception.OConcurrentModificationException"
    );
  };

  this.isTokenException = () => {
    return (
      this.type ===
      "com.orientechnologies.orient.enterprise.channel.binary.OTokenSecurityException"
    );
  };
});
