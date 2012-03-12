Introduction
========

This is a node.js driver for OrientDB. This has some roots in [christkv](https://github.com/christkv)'s [node-mongodb-native](https://github.com/christkv/node-mongodb-native) and in [yojimbo87](https://github.com/yojimbo87)'s [east](https://github.com/yojimbo87/east) OrientDB drivers.

Status
========

Under construction OrientDB node.js driver.

Currently this driver implements the OrientDB binary protocol but the plan is to provide both the HTTP and the binary protocol.

Check the list below to see what is and what isn't yet implemented. (Just pick a "not implemented" one and send us a pull request.)

* SHUTDOWN
* CONNECT
* DB_OPEN
* DB_CREATE
* DB_CLOSE
* DB_EXIST
* DB_DELETE
* DB_SIZE
* DB_COUNTRECORDS
* DATACLUSTER_ADD
* DATACLUSTER_REMOVE
* DATACLUSTER_COUNT
* DATACLUSTER_DATARANGE
* DATASEGMENT_ADD (not implemented)
* DATASEGMENT_REMOVE (not implemented)
* RECORD_LOAD (not implemented)
* RECORD_CREATE (not implemented)
* RECORD_UPDATE (not implemented)
* RECORD_DELETE (not implemented)
* COUNT
* COMMAND
* TX_COMMIT (not implemented)
* CONFIG_GET (not implemented)
* CONFIG_SET (not implemented)
* CONFIG_LIST (not implemented)

Installation
========

NOTE: Don't do this yet in production! Do it only if you test or develop stuff.

```
npm install orientdb
```

As developer you should fork/clone this repo and once you have it on wour machine, do the following in your repo directory:

```
npm install
```

Testing
========

An OrientDB server instance must be running. Use the [test configuration files](https://github.com/gabipetrovay/node-orientdb/tree/master/config/test) to provide data to the tests about the running instance (user, port, etc.).

Then run:

`npm test`

to run all the tests under `test`, or

`node node_modules/tap/bin/tap.js ./test/db_open_close.js`

to run a specific test.

And make sure all run before you make a pull request.

NOTE: The `test/shutdown.js` will shutdown the server. So make sure this runs the last one. (i.e. Don't add a test that is after this one in Lexicographical order.)
