/*jshint esversion: 6 */
"use strict";

const Promise = require("bluebird");
const Readable = require("stream").Readable;

/**
 *  Result Set
 */
class OResult extends Readable {
  constructor(db, pageSize) {
    super({ objectMode: true });
    this.queryClosed= false;
    this.db = db;
    this.pageSize = pageSize || 100;
    this.requestedNext = false;

    this.on("resume", () => {
      this._fetchNext();
    });
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

  _fetchNext() {
    if (!this.isPaused() && !this.queryClosed && this.requestedNext) {
      let msg = {
        queryId: this.queryId,
        pageSize: this.pageSize,
        stream: this
      };
      this.db
        .send("query-next", msg)
        .then(() => {
          // Todo Do something?
        })
        .catch(err => {
          this.emit("error", err);
        });
    }
  }
  one() {
    return this.all().then(results => {
      return results[0];
    });
  }

  close() {
    if (!this.queryClosed) {
      let msg = {
        queryId: this.queryId
      };
      this.queryClosed = true;
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
