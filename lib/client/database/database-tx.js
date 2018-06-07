/*jshint esversion: 6 */
"use strict";

const Transaction = require("../../db/transaction");
const RID = require("../../recordid");
const Promise = require("bluebird");

class ODatabaseTransaction extends Transaction {
  constructor(db, id) {
    super(db, id);
    this.begin = false;
    this._finalCreated = [];
    this._finalUpdated = [];
    this._finalDeleted = [];
  }

  /**
   * Prepare the transaction
   */
  prepare() {
    return this.db.cluster
      .list()
      .bind(this)
      .then(function() {
        return [this._creates, this._updates, this._deletes];
      });
  }

  /**
   * Prepare the transaction for final Commit
   */
  finalPrepare() {
    return this.db.cluster
      .list()
      .bind(this)
      .then(function() {
        return [this._finalCreated, this._finalUpdated, this._finalDeleted];
      });
  }

  /**
   * Commit the transaction.
   * @return {Promise} The results of the transaction.
   */
  commit(changes) {
    return this._flush().then(() => {
      if (changes) {
        if (changes.created) {
          Array.prototype.push.apply(this._finalCreated, changes.created);
        }
        if (changes.updated) {
          Array.prototype.push.apply(this._finalUpdated, changes.updated);
        }
      }
      return this.finalPrepare()
        .spread(function(creates, updates, deletes) {
          return this.db
            .send("tx-commit", {
              storageType: this.db.storage,
              txLog: true,
              txId: this.id,
              creates: [],
              updates: [],
              deletes: []
            })
            .then(function(response) {
              return [creates, updates, deletes, response];
            });
        })
        .spread(function(creates, updates, deletes, response) {
          this.db.currentTx = null;
          return {
            created: response.created.map(function(result) {
              var total = creates.length,
                item,
                i;
              for (i = 0; i < total; i++) {
                item = creates[i];
                if (
                  item["@rid"].cluster === result.tmpCluster &&
                  item["@rid"].position === result.tmpPosition
                ) {
                  item["@rid"].cluster = result.cluster;
                  item["@rid"].position = result.position;
                  return item;
                }
              }
              return {
                "@rid": new RID({
                  cluster: result.cluster,
                  position: result.position
                }),
                "@version": result.version
              };
            }),
            updated: response.updated.map(function(result) {
              var total = updates.length,
                item,
                i;

              for (i = 0; i < total; i++) {
                item = updates[i];
                if (
                  item["@rid"].cluster === result.cluster &&
                  item["@rid"].position === result.position
                ) {
                  item["@version"] = result.version;
                  return item;
                }
              }
              return {
                "@rid": new RID({
                  cluster: result.cluster,
                  position: result.position
                }),
                "@version": result.version
              };
            }),
            deleted: deletes
          };
        });
    });
  }

  _flush() {
    if (this.hasChanges()) {
      if (this.begin) {
        return this._sendChanges();
      } else {
        return this._sendBegin();
      }
    } else if (!this.begin) {
      return this._sendBegin();
    } else {
      return Promise.resolve({ created: [], updated: [], deleted: [] });
    }
  }

  _sendChanges() {
    return this.prepare().spread(function(creates, updates, deletes) {
      return this.db
        .send("record-batch", {
          storageType: this.db.storage,
          txLog: true,
          txId: this.id,
          creates: creates,
          updates: updates,
          deletes: deletes
        })
        .bind(this)
        .then(function(response) {
          this._creates = [];
          this._updates = [];
          this.deletes = [];
          let changes = [creates, updates, deletes, response];
          Array.prototype.push.apply(this._finalCreated, creates);
          Array.prototype.push.apply(this._finalUpdated, updates);
          Array.prototype.push.apply(this._finalDeleted, deletes);
          return changes;
        });
    });
  }

  _sendBegin() {
    return this.prepare().spread(function(creates, updates, deletes) {
      return this.db
        .send("tx-begin", {
          storageType: this.db.storage,
          txLog: true,
          txId: this.id,
          creates: creates,
          updates: updates,
          deletes: deletes
        })
        .bind(this)
        .then(function(response) {
          this.begin = true;
          this._creates = [];
          this._updates = [];
          this.deletes = [];
          let changes = [creates, updates, deletes, response];
          Array.prototype.push.apply(this._finalCreated, creates);
          Array.prototype.push.apply(this._finalUpdated, updates);
          Array.prototype.push.apply(this._finalDeleted, deletes);
          return changes;
        });
    });
  }

  /**
   * Rollbacks the transaction.
   * @return {Promise} The results of the rollback.
   */
  rollback() {
    return this.db
      .send("tx-rollback", {
        txId: this.id
      })
      .then(response => {
        this.db.currentTx = null;
        return { created: [], updated: [], deleted: [] };
      });
  }

  hasChanges() {
    return this._creates.length || this._updates.length || this._deletes.length;
  }
}

module.exports = ODatabaseTransaction;
