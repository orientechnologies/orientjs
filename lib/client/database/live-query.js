/*jshint esversion: 6 */
"use strict";

const Promise = require("bluebird");
const Readable = require("stream").Readable;

/**
 *  Result Set
 */
class LiveQuery extends Readable {
  constructor(db, options) {
    super({ objectMode: true });
    this.db = db;
    this.options = options;
    this._subscribe(db, options);
  }

  _read(size) {}
  /**
   *
   * @return {Promise}
   */

  unsubscribe() {
    let data = {
      monitorId: this.monitorId
    };
    this.db.sessionManager
      .sendOnSubscribe(this, "unsubscribe-live-query", data)
      .then(() => {
        this.db.client.logger.debug(
          `Unsubscribe sent to live query '${
            this.options.query
          }' with monitor id : ${this.monitorId}`
        );
      })
      .catch(err => {
        throw err;
      });
  }

  _subscribe(db, options) {
    db.sessionManager
      .sendOnSubscribe(this, "subscribe-live-query", options, resource => {
        this.resource = resource;
      })
      .then(response => {
        this.monitorId = response.monitorId;
        this.db.client.logger.debug(
          `Live query  '${options.query}' subscribed with monitor id : ${
            this.monitorId
          }`
        );
        this.resource.connection.on(
          "live-query-result",
          (token, op, result) => {
            let monitorId = result.monitorId;
            if (this.monitorId === monitorId) {
              this.db.client.logger.debug(
                `Live query results for '${
                  options.query
                }' with monitor id : ${monitorId}`
              );
              result.events.forEach(e => {
                let msg = {
                  monitorId: monitorId,
                  operation: e.type,
                  data: e.data
                };
                if (e.type == 2) {
                  msg.before = e.before;
                }
                this.push(msg);
              });
            }
          }
        );
        this.resource.connection.on("live-query-end", monitorId => {
          if (this.monitorId === monitorId) {
            this.db.client.logger.debug(
              `Live query '${this.options.query}' with monitor id : ${
                this.monitorId
              } completed`
            );
            this.emit("end");
          }
        });
      })
      .catch(err => {
        this.subscribing = null;
        this.emit("error", err);
      });
  }
}

module.exports = LiveQuery;
