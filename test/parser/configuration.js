var assert = require("assert");
var parser = require("../../lib/orientdb/connection/parser");

var configAsString = "2| |#0:1| |#0:2|it|IT|yyyy-MM-dd|yyyy-MM-dd HH:mm:ss|0|mmap|500Kb|500Mb|50%|auto|0|0|0| |mmap|512mb|false|true|0|";

var config = parser.parseConfiguration(configAsString);

assert.equal(2, config.version);
assert.equal(null, config.name);
assert.equal("#0:1", config.schemaRecordId);
assert.equal(null, config.dictionaryRecordId);
assert.equal("#0:2", config.indexMgrRecordId);
assert.equal("it", config.localeLanguage);
assert.equal("IT", config.localeCountry);
assert.equal("yyyy-MM-dd", config.dateFormat);
assert.equal("yyyy-MM-dd HH:mm:ss", config.dateTimeFormat);
assert.equal("0", config.fileTemplate.maxSize);
assert.equal("mmap", config.fileTemplate.fileType);
assert.equal("500Kb", config.fileTemplate.fileStartSize);
assert.equal("500Mb", config.fileTemplate.fileMaxSize);
assert.equal("50%", config.fileTemplate.fileIncrementSize);
assert.equal("auto", config.fileTemplate.defrag);
assert.equal(0, config.fileTemplate.infoFiles);
assert.equal(0, config.clusters.length);
assert.equal(0, config.dataSegments.length);
assert.equal(null, config.txSegment.path);
assert.equal("mmap", config.txSegment.type);
assert.equal("512mb", config.txSegment.maxSize);
assert.equal(false, config.txSegment.synchRecord);
assert.equal(true, config.txSegment.synchTx);
assert.equal(0, config.properties.length);

configAsString = "2| |#0:1| |#0:2|it|IT|yyyy-MM-dd|yyyy-MM-dd HH:mm:ss|0|mmap|500Kb|500Mb|50%|auto|0|6|0|internal|p|0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/internal.0.ocl|mmap|500Mb|${STORAGE_PATH}/internal.och|mmap|500Mb|1|index|p|0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/index.0.ocl|mmap|500Mb|${STORAGE_PATH}/index.och|mmap|500Mb|2|default|p|0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/default.0.ocl|mmap|500Mb|${STORAGE_PATH}/default.och|mmap|500Mb|3|orole|p|0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/orole.0.ocl|mmap|500Mb|${STORAGE_PATH}/orole.och|mmap|500Mb|4|ouser|p|0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/ouser.0.ocl|mmap|500Mb|${STORAGE_PATH}/ouser.och|mmap|500Mb|5|fantasyperson|p|0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/fantasyperson.0.ocl|mmap|500Mb|${STORAGE_PATH}/fantasyperson.och|mmap|500Mb|1|0|default|0|mmap|1Mb|500Mb|100%|auto|1|${STORAGE_PATH}/default.0.oda|mmap|500Mb|${STORAGE_PATH}/default.odh|mmap|0|${STORAGE_PATH}/txlog.otx.otd.otd.otd|mmap|512mb|false|true|0|";
config = parser.parseConfiguration(configAsString);
assert.equal(6, config.clusters.length);
assert.equal(5, config.clusters[5].clusterId);
assert.equal("${STORAGE_PATH}/internal.0.ocl", config.clusters[0].fileTemplate.infoFiles[0].path);

configAsString = "3| |#2:0| |#0:1|it|IT|yyyy-MM-dd|yyyy-MM-dd HH:mm:ss| |0|mmap|500Kb|500Mb|50%|auto|0|0|0| |mmap|512mb|false|true|0|";
config = parser.parseConfiguration(configAsString);

assert.equal(3, config.version);
assert.equal(null, config.name);
assert.equal("#2:0", config.schemaRecordId);
assert.equal(null, config.dictionaryRecordId);
assert.equal("#0:1", config.indexMgrRecordId);
assert.equal("it", config.localeLanguage);
assert.equal("IT", config.localeCountry);
assert.equal("yyyy-MM-dd", config.dateFormat);
assert.equal("yyyy-MM-dd HH:mm:ss", config.dateTimeFormat);
assert.equal("0", config.fileTemplate.maxSize);
assert.equal("mmap", config.fileTemplate.fileType);
assert.equal("500Kb", config.fileTemplate.fileStartSize);
assert.equal("500Mb", config.fileTemplate.fileMaxSize);
assert.equal("50%", config.fileTemplate.fileIncrementSize);
assert.equal("auto", config.fileTemplate.defrag);
assert.equal(0, config.fileTemplate.infoFiles);
assert.equal(0, config.clusters.length);
assert.equal(0, config.dataSegments.length);
assert.equal(null, config.txSegment.path);
assert.equal("mmap", config.txSegment.type);
assert.equal("512mb", config.txSegment.maxSize);
assert.equal(false, config.txSegment.synchRecord);
assert.equal(true, config.txSegment.synchTx);
assert.equal(0, config.properties.length);


configAsString = "3| |#2:0| |#0:1|it|IT|yyyy-MM-dd|yyyy-MM-dd HH:mm:ss| |0|mmap|500Kb|500Mb|50%|auto|0|6|0|internal|0|p| |0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/internal.0.ocl|mmap|500Mb|${STORAGE_PATH}/internal.och|mmap|500Mb|1|index|0|p| |0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/index.0.ocl|mmap|500Mb|${STORAGE_PATH}/index.och|mmap|500Mb|2|default|0|p| |0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/default.0.ocl|mmap|500Mb|${STORAGE_PATH}/default.och|mmap|500Mb|3|orole|0|p| |0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/orole.0.ocl|mmap|500Mb|${STORAGE_PATH}/orole.och|mmap|500Mb|4|ouser|0|p| |0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/ouser.0.ocl|mmap|500Mb|${STORAGE_PATH}/ouser.och|mmap|500Mb|5|orids|0|p| |0|mmap|1Mb|500Mb|50%|auto|1|${STORAGE_PATH}/orids.0.ocl|mmap|500Mb|${STORAGE_PATH}/orids.och|mmap|500Mb|1|0|default| |0|mmap|1Mb|500Mb|100%|auto|1|${STORAGE_PATH}/default.0.oda|mmap|500Mb|/home/federico/materiale/works_My/orientdb-graphed-1.0/databases/presentz/default.odh|mmap|0|${STORAGE_PATH}/txlog.otx|mmap|512mb|false|true|0|";
config = parser.parseConfiguration(configAsString);
assert.equal(3, config.version);
assert.equal(6, config.clusters.length);
assert.equal(5, config.clusters[5].clusterId);
assert.equal("${STORAGE_PATH}/internal.0.ocl", config.clusters[0].fileTemplate.infoFiles[0].path);
