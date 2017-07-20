/*jshint esversion: 6 */
"use strict";

const Operation = require('../operation'),
  constants = require('../constants'),
  serializer = require('../serializer'),
  writer = require('../writer'),
  RID = require('../../../../recordid'),
  utils = require('../../../../utils');

module.exports = Operation.extend({
  id: 'REQUEST_QUERY',
  opCode: 45,
  writer: function () {

    const isNamed = (this.data.params && this.data.params.params) ? !Array.isArray(this.data.params.params) : true;
    this
      .writeHeader(this.opCode, this.data.sessionId, this.data.token)
      .writeString(this.data.language || 'sql')
      .writeString(this.data.query)
      .writeBoolean(false) // Idempotent
      .writeInt(this.data.pageSize || 100)
      .writeBytes(this.serializeParams())
      .writeBoolean(isNamed); // is Named params
  },

  serializeParams: function () {
    let content;
    if (this.data.params && this.data.params.params && Object.keys(this.data.params.params).length > 0) {
      let doc = {
        params: this.data.params.params
      };
      content = serializer.serializeDocument(doc);
    } else {
      content = new Buffer(0);
    }
    return content;
  },
  reader: function () {
    this
      .readStatus('status')
      .readResultSet();
  },
  readCommandResult: function (fieldName, reader) {

    this.readOps.push(function (data) {

      data[fieldName] = {};
      this.stack.push(data[fieldName]);
      this.readString('queryId', function (data) {
        this.data.observable.queryId = data.queryId;
      });
      this.readBoolean('txChanges');
      this.readExecutionPlan("executionPlan");
    });
    return this;
  },

  readResultSet: function () {

    this.readOps.push(() => {


      let header = {};
      this.stack.push(header);
      this.readString('queryId', (data) => {
        this.data.observable.queryId = data.queryId;
      });
      this.readBoolean('txChanges');
      this.readPlan("executionPlan", (data) => {
        if (data.hasExecutionPlan) {
          data.executionPlan = data.executionPlan.value;
        }
        this.data.observable.metadata = data;
        this.readOps.push(() => {
          let current = {};
          this.stack.push(current);
          this.readInt("count", (data) => {
            this.readRecord(data.count, (record) => {
              this.data.subscriber.next(record);
            }, () => {
              this.readHasNext();
              this.readStats("stats");
            });
          });
        });
      });
    });
  },
  readRecord(count, onRead, onEnd){

    if (count === 0) {
      onEnd();
      return;
    }
    this.readElement("result", (data) => {
      let result = data.result;
      let record = result.value;
      if (result.elementType === 3 || result.elementType === 2 || result.elementType === 1) {
        record['@rid'] = new RID({
          cluster: result.cluster,
          position: result.position
        });
        record['@version'] = result.version;
      }
      onRead(record);
      count--;
      this.readRecord(count, onRead, onEnd);
    });

  },
  readHasNext(){
    this.readBoolean("hasNext", (data) => {

      if (data.hasNext) {
        let msg = {
          queryId: this.data.observable.queryId,
          pageSize: this.data.pageSize,
          subscriber: this.data.subscriber,
          observable: this.data.observable
        };
        this.data.observable.db.send('query-next', msg)
          .then(() => {
            // Todo Do something?
          }).catch((err) => {
          this.data.subscriber.error(err);
        });
      } else {
        let msg = {
          queryId: this.data.observable.queryId,
        };
        this.data.observable.db.send('query-close', msg).then(() => {
          this.data.subscriber.complete();
        }).catch((err) => {
          this.data.subscriber.error(err);
        });
      }
    });
  },
  readPlan: function (fieldName, next) {

    this.readBoolean('hasExecutionPlan', (data) => {
      if (data.hasExecutionPlan) {
        this.readElement('executionPlan', next);
      } else {
        next(data);
      }
    });

  },
  readStats: function (fieldName) {
    this.readInt('statsSize');
  }
});
