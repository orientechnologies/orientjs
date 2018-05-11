/*jshint esversion: 6 */
"use strict";

const Promise = require("bluebird");
const Readable = require("stream").Readable;

/**
 *  Result Set
 */
class OResult extends Readable {
  constructor() {
    super({ objectMode: true });
  }

  _read(size) {}
  /**
   *
   * @return {Promise}
   */
  all() {
    return new Promise((resolve, reject) => {
      let results = [];
      this.on("data", item => {
        results.push(item);
      });
      this.once("end", () => {
        resolve(results);
      });
      this.once("error", err => {
        reject(err);
      });
    });
  }

  // subscribe(observer) {
  //   this.stream.subscribe(observer);
  // }
}

module.exports = OResult;
