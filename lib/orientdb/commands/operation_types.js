"use strict";

/*
 * See com.orientechnologies.orient.enterprise.channel.binary.OChannelBinaryProtocol
 */
module.exports = {
    // OUTGOING
    SHUTDOWN: 1,
    CONNECT: 2,

    DB_OPEN: 3,
    DB_CREATE: 4,
    DB_CLOSE: 5,
    DB_EXIST: 6,
    DB_DROP: 7,
    DB_SIZE: 8,
    DB_COUNTRECORDS: 9,

    DATACLUSTER_ADD: 10,
    DATACLUSTER_DROP: 11,
    DATACLUSTER_COUNT: 12,
    DATACLUSTER_DATARANGE: 13,
    DATACLUSTER_LH_CLUSTER_IS_USED: 16, // since 1.2.0

    DATASEGMENT_ADD: 20,
    DATASEGMENT_DROP: 21,

    RECORD_LOAD: 30,
    RECORD_CREATE: 31,
    RECORD_UPDATE: 32,
    RECORD_DELETE: 33,
    RECORD_CHANGE_IDENTITY: 35, // since 1.2.0
    POSITIONS_HIGHER: 36, // since 1.3.0
    POSITIONS_LOWER: 37, // since 1.3.0
    RECORD_CLEAN_OUT: 38, // since 1.3.0
    POSITIONS_FLOOR: 39, // since 1.3.0

    COUNT: 40,
    COMMAND: 41,
    POSITIONS_CEILING: 42, // since 1.3.0

    TX_COMMIT: 60,

    CONFIG_GET: 70,
    CONFIG_SET: 71,
    CONFIG_LIST: 72,
    DB_RELOAD: 73, // SINCE 1.0rc4
    DB_LIST: 74, // SINCE 1.0rc6

    PUSH_RECORD: 79,
    PUSH_DISTRIB_CONFIG: 80,

    // DISTRIBUTED
    DB_COPY: 90, // SINCE 1.0rc8
    REPLICATION: 91, // SINCE 1.0
    CLUSTER: 92, // SINCE 1.0

    // Lock + sync
    DB_FREEZE: 94, // SINCE 1.1.0
    DB_RELEASE: 95, // SINCE 1.1.0

    ERROR_COMMAND: -999  // driver internal: not a real command
};