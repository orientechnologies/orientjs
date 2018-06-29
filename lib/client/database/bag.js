/*jshint esversion: 6 */
"use strict";

class ORidBag {
  constructor(delegate) {
    this.delegate = delegate;
    this[Symbol.iterator] = function*() {
      let iter = this.delegate[Symbol.iterator]();
      let elem = iter.next();
      while (!elem.done) {
        yield elem.value;
        elem = iter.next();
      }
    };
  }

  size() {
    return this.delegate.size();
  }

  push(rid) {
    this.delegate.push(rid);
  }
}

class OEmbeddedRidBag {
  constructor() {
    this.entries = [];
    this[Symbol.iterator] = function*() {
      for (let i = 0; i < this.entries.length; i++) {
        yield this.entries[i];
      }
    };
  }

  push(rid) {
    this.entries.push(rid);
  }

  size() {
    return this.entries.length;
  }
}
class OSBTreeRidBag {
  constructor({ size }) {
    this.size = size;
  }

  size() {
    return this.size;
  }
}
exports.ORidBag = ORidBag;
exports.OEmbeddedRidBag = OEmbeddedRidBag;
exports.OSBTreeRidBag = OSBTreeRidBag;
