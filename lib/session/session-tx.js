/*jshint esversion: 6 */
"use strict";

const Transaction = require('../db/transaction');
const Promise = require('bluebird');

class SessionTransaction extends Transaction {

  constructor(session, id) {
    super(session, id);
  }

  commit() {
    return super.commit().then((res) => {
      this.db.currentTx = null;
      return res;
    });
  }

  flush() {
    return this.hasChanges() ? this.sendFlush() : Promise.resolve({created: [], updated: [], deleted: []});
  }

  sendFlush() {
    return this.prepare()
      .spread(function (creates, updates, deletes) {
        return this.db.send('tx-begin', {
          storageType: this.db.storage,
          txLog: true,
          txId: this.id,
          creates: creates,
          updates: updates,
          deletes: deletes
        })
          .then(function (response) {
            return [creates, updates, deletes, response];
          });
      });
  }

  rollback() {
    return this.db.send('tx-rollback', {
      txId: this.id
    })
      .then((response) => {
        this.db.currentTx = null;
        return {created: [], updated: [], deleted: []};
      });
  }

  hasChanges() {
    return this._creates.length || this.updates.length || this.deletes.length;
  }
}


module.exports = SessionTransaction;



