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

    let isNamed = (this.data.params && this.data.params.params) ? !Array.isArray(this.data.params.params) : true;
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
      .readCommandResult('result');
  },
  readCommandResult: function (fieldName, reader) {

    this.payloads = [];
    this.readOps.push(function (data) {
      data[fieldName] = {};
      this.stack.push(data[fieldName]);
      this.readString('queryId', function (data) {
        this.data.observable.queryId = data.queryId;
      });
      this.readBoolean('txChanges');
      this.readExecutionPlan("executionPlan");
      this.readOps.push(function (data) {

      });
    });
    return this;
  },
  readExecutionPlan: function (fieldName) {
    this.readOps.push(function (data) {
      data[fieldName] = {};
      this.stack.push(data[fieldName]);
      this.readBoolean('hasExecution', function (data) {
        if (data.hasExecution) {
          this.readElement('executionPlan', function (data) {
            this.stack.pop();
            this.readResults('results', function (data) {
              let record = data.value;
              if (data.elementType === 3 || data.elementType === 2 || data.elementType === 1) {
                record['@rid'] = new RID({
                  cluster: data.cluster,
                  position: data.position
                });
                record['@version'] = data.version;
              }
              this.data.subscriber.next(record);
            });
          });
        }
      });
    });
  },


  readResults: function (fieldName, reader) {
    this.readBoolean('more', function (data) {
      if (data.more) {
        data[fieldName] = {};
        this.stack.push(data[fieldName]);
        this.readElement('result', function (data) {
          if (reader) {
            reader.call(this, data.result);
          }
          this.stack.pop();
          this.readResults("results", reader);
        });
      } else {
        // TODO check if has more pages if yes fetch other results
        this.readBoolean('hasNext', function (data) {
          if (data.hasNext) {
            let msg = {
              queryId: this.data.observable.queryId,
              pageSize: this.data.pageSize,
              subscriber: this.data.subscriber,
              observable: this.data.observable
            };
            this.data.observable.session.send('query-next', msg)
              .then(() => {
                // Todo Do something?
              }).catch((err) => {
              this.data.subscriber.error(err);
            });
          } else {

            let msg = {
              queryId: this.data.observable.queryId,
            };
            this.data.observable.session.send('query-close', msg).then(() => {
              this.data.subscriber.complete();
            }).catch((err) => {

              this.data.subscriber.error(err);
            });
          }

        });
        this.readStats('stats', function (data) {
        });
      }
    });
  },
  readStats: function (fieldName) {
    this.readInt('statsSize');
  }
});
