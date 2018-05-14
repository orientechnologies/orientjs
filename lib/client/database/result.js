/*jshint esversion: 6 */
"use strict";

const Promise = require("bluebird");
const Readable = require("stream").Readable;

/**
 *  Result Set
 */
class OResult extends Readable {
  constructor(db) {
    super({ objectMode: true });
    this.closed = false;
    this.db = db;
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
  one() {
    return this.all().then(results => {
      return results[0];
    });
  }

  close() {
    if (!this.closed) {
      let msg = {
        queryId: this.queryId
      };
      this.closed = true;
      this.db
        .send("query-close", msg)
        .then(() => {
          this.push(null);
        })
        .catch(err => {
          this.emit("error", err);
        });
    }
  }
}

module.exports = OResult;
