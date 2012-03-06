Introduction
========

This is a node.js driver for OrientDB. This has some roots in christk's node-mongodb-native and in yojimbo87's east OrientDB drivers.

Status
========

Under construction OrientDB node.js driver.

Currently this driver implements the OrientDB binary protocol but the plan is to provide both the HTTP and the binary protocol.

The following commands are implemented so far:

* CONNECT
* DB_OPEN
* DB_CREATE
* DB_CLOSE
* DB_EXIST
* DB_RELOAD
* DB_DELETE
* DB_SIZE
* DB_COUNTRECORDS
* COMMAND (under construction)
* SHUTDOWN