/*jshint esversion: 6 */
"use strict";

const Transaction = require("../../db/transaction");
const RID = require("../../recordid");
const Promise = require("bluebird");

const applyCreated = (response, creates) => {
  return response.created.map(function(result) {
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
        item["@version"] = result.version;
        return item;
      }
      if (
        item["@rid"].cluster === result.cluster &&
        item["@rid"].position === result.position
      ) {
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
  });
};

const applyUpdated = (response, updates) => {
  return response.updated.map(function(result) {
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
  });
};

const applyDeleted = (response, deletes) => {
  return response.deleted.map(function(result) {
    var total = deletes.length,
      item,
      i;
    for (i = 0; i < total; i++) {
      item = deletes[i];
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
      })
    };
  });
};
class ODatabaseTransaction extends Transaction {
  constructor(db, id) {
    super(db, id);
    this.begin = false;
    this._finalCreated = [];
    this._finalUpdated = [];
    this._finalDeleted = [];
  }

  /**
   * Execute an SQL query against the database and retreive the results
   * @param   {String} query    The query or command to execute.
   * @param   {Object} options  The options for the query
   * @return {OResult}          The results of the query
   */
  query(query, options) {
    return this.db.query(query, options);
  }

  /**
   * Execute an SQL command against the database and retreive the results
   * @param   {String} command    The command to execute.
   * @param   {Object} options  The options for the command
   * @return  {OResult}          The results of the command
   */
  command(command, options) {
    return this.db.command(command, options);
  }

  /**
   * Prepare the transaction
   */
  _prepare() {
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
  _finalPrepare() {
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
      return this._finalPrepare()
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
            created: applyCreated(response, creates),
            updated: applyUpdated(response, updates),
            deleted: applyDeleted(response, deletes),
            applyChanges: changes => {
              let created = [];
              Array.prototype.push.apply(created, creates);
              if (changes.created) {
                Array.prototype.push.apply(created, changes.created);
              }
              let updated = [];
              Array.prototype.push.apply(updated, updates);
              if (changes.updated) {
                Array.prototype.push.apply(updated, changes.updated);
              }
              return {
                created: applyCreated(response, created),
                updated: applyUpdated(response, updated),
                deleted: deletes
              };
            }
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
    return this._prepare().spread(function(creates, updates, deletes) {
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
    return this._prepare().spread(function(creates, updates, deletes) {
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
