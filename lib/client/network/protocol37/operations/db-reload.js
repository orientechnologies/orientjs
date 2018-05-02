/*jshint esversion: 6 */
"use strict";

var Operation = require("../operation"),
  constants = require("../constants");

module.exports = Operation.extend({
  id: "REQUEST_DB_RELOAD",
  opCode: 73,
  writer: function() {
    this.writeHeader(this.opCode, this.data.sessionId, this.data.token);
  },
  reader: function() {
    this.readStatus("status")
      .readString("dateFormat")
      .readString("dateTimeFormat")
      .readString("name")
      .readInt("version")
      .readString("directory")
      .readInt("totalProperties")
      .readArray("properties", data => {
        var properties = [],
          total = data.totalProperties,
          i;

        for (i = 0; i < total; i++) {
          properties.push(function(data) {
            this.readString("name").readString("value");
          });
        }
        return properties;
      })
      .readRecordId("schemaRecordId")
      .readRecordId("indexMgrRecordId")
      .readString("clusterSelection")
      .readString("conflictStrategy")
      .readBoolean("validationEnabled")
      .readString("localeLanguage")
      .readInt("minimumClusters")
      .readBoolean("strictSql")
      .readString("charset")
      .readString("timeZone")
      .readString("localeCountry")
      .readString("recordSerializer")
      .readInt("recordSerializerVersion")
      .readInt("binaryFormatVersion")
      .readInt("totalClusters")
      .readArray("clusters", function(data) {
        var clusters = [],
          total = data.totalClusters,
          i;
        for (i = 0; i < total; i++) {
          clusters.push(function(data) {
            this.readInt("id").readString("name");
          });
        }
        return clusters;
      });
  }
});
