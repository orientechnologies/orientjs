/*jshint esversion: 6 */
"use strict";

const Observable = require('rxjs').Observable;
const Promise = require('bluebird');


/**
 *  Result Set
 */
class OResult extends Observable {


  constructor(subscriber) {
    super(subscriber);
  }

  /**
   *
   * @return {Promise}
   */
  all() {
    return new Promise((resolve, reject) => {
      let results = [];
      this.subscribe((record) => {
          results.push(record);
        },
        (err) => {
          reject(err);
        }, () => {
          resolve(results);
        });
    });
  }
}


module.exports = OResult;