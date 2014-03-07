

/**
 * Parse a server configuration string.
 *
 * @see OStorageConfiguration.fromStream(byte[]) method in the java implementation
 *
 * @param  {String} configString The configuration string
 * @return {Object}              The configuration object
 */
function parseConfiguration (configString) {
  var values = configString.split("|"),
      index = 0,
      config = {};

  config.version = +read(values[index++]);
  config.name = read(values[index++]);
  config.schemaRecordId = read(values[index++]);
  config.dictionaryRecordId = read(values[index++]);

  if (config.version > 0) {
    config.indexMgrRecordId = read(values[index++]);
  }
  else {
    config.indexMgrRecordId = null;
  }

  config.localeLanguage = read(values[index++]);
  config.localeCountry = read(values[index++]);
  config.dateFormat = read(values[index++]);
  config.dateTimeFormat = read(values[index++]);

  if (config.version >= 4) {
    config.timeZone = read(values[index++]);
    config.charset = read(values[index++]);
  }

  if (config.version > 1) {
    index = phySegmentFromStream(config, config.version, values, index);
  }

  index = clustersFromStream(config, config.version, values, index);
  index = dataSegmentsFromStream(config, config.version, values, index);

  config.txSegment = {};
  config.txSegment.path = read(values[index++]);
  config.txSegment.type = read(values[index++]);
  config.txSegment.maxSize = read(values[index++]);
  config.txSegment.synchRecord = read(values[index++]) === "true";
  config.txSegment.synchTx = read(values[index++]) === "true";

  index = propertiesFromStream(config, values, index);

  return config;
}

function read (value) {
  if (value === " ") {
    return null;
  }
  return value;
}

function phySegmentFromStream (config, version, values, index) {
  var fileTemplate = {},
      size, i, fileName, infoFile, pos;

  if (version > 2) {
    fileTemplate.location = read(values[index++]);
  }
  else {
    fileTemplate.location = null;
  }

  fileTemplate.maxSize = read(values[index++]);
  fileTemplate.fileType = read(values[index++]);
  fileTemplate.fileStartSize = read(values[index++]);
  fileTemplate.fileMaxSize = read(values[index++]);
  fileTemplate.fileIncrementSize = read(values[index++]);
  fileTemplate.defrag = read(values[index++]);
  fileTemplate.infoFiles = [];

  size = +read(values[index++]);

  for (i = 0; i < size; i++) {
    fileName = read(values[index++]);
    if (fileName.indexOf("$") === -1) {
      // @COMPATIBILITY 0.9.25
      pos = fileName.indexOf("/databases");
      if (pos > -1) {
        fileName = "${ORIENTDB_HOME}" + fileName.substring(pos);
      }
    }

    infoFile = {};
    infoFile.path = fileName;
    infoFile.type = read(values[index++]);
    infoFile.maxSize = read(values[index++]);
    infoFile.incrementSize = fileTemplate.fileIncrementSize;
    fileTemplate.infoFiles.push(infoFile);
  }

  config.fileTemplate = fileTemplate;

  return index;
}

function clustersFromStream (config, version, values, index) {
  config.clusters = [];
  var size = parseInt(read(values[index++])),
      cluster, clusterId, i, holeFile, holeFlag;

  for (i = 0; i < size; i++) {
    clusterId = +read(values[index++]);

    if (clusterId === -1) {
      continue;
    }

    cluster = {};
    cluster.clusterId = clusterId;
    cluster.clusterName = read(values[index++]);
    cluster.dataSegmentId = version >= 3 ? +read(values[index++]) : 0;
    cluster.clusterType = read(values[index++]);

    if (cluster.clusterType === "p") {
      index = phySegmentFromStream(cluster, version, values, index);

      if (version > 4) {
        holeFlag = read(values[index++]);
      }
      else {
        holeFlag = "f";
      }

      if (holeFlag === "f") {
          cluster.holeFile = {};
          cluster.holeFile.path = read(values[index++]);
          cluster.holeFile.type = read(values[index++]);
          cluster.holeFile.maxSize = read(values[index++]);
      }
    }
    else if (cluster.clusterType === "m") {
      // nothing
    }
    else if (cluster.clusterType === "h") {
      // nothing
    }
    else {
      //throw new Error("Unknown cluster type: " + cluster.clusterType);
    }

    config.clusters.push(cluster);
  }
  return index;
}

function dataSegmentsFromStream (config, version, values, index) {
  config.dataSegments = [];
  var size = +read(values[index++]),
      dataId, dataSegment, i;
  for (i = 0; i < size; i++) {
    dataId = +read(values[index++]);
    if (dataId === -1) {
      continue;
    }
    dataSegment = {
      dataId: dataId,
      dataName: read(values[index++])
    };
    index = phySegmentFromStream(dataSegment, version, values, index);
    dataSegment.holeFile = {
      path: read(values[index++]),
      type: read(values[index++]),
      maxSize: read(values[index++])
    };
    config.dataSegments.push(dataSegment);
  }
  return index;
}

function propertiesFromStream (config, values, index) {
  config.properties = [];
  var size = +read(values[index++]),
      i;
  for (i = 0; i < size; i++) {
    config.properties.push({
      name: read(values[index++]),
      value: read(values[index++])
    });
  }
  return index;
};




exports.parseConfiguration = parseConfiguration;