Introduction
========

This is a node.js driver for OrientDB using the OrientDB binary protocol.

Installation
========

```
npm install orientdb
```

As developer you should fork/clone this repo and once you have it on your machine, do the following in your repo directory:

```
npm install
```

Tutorial
========

To start using OrientDB and nodejs, check out the ["Blog Tutorial"](https://github.com/gabipetrovay/node-orientdb/wiki/Blog-Tutorial-with-ExpressJS-and-OrientDB).

Status
========

This OrientDB driver is almost mature now, but we are still testing it. While we use it in production already and therefore it implements a sufficient number of features for making a fully featured application, we recommend you make some thorough tests before you do it as well. If you find any problems, let us know such that we can improve things. Until version 1.0 we also don't guarantee any backwards compatibility and API stability since we are trying things out. But 1.0 should not be far from now.

The following commands are not implemented yet (just pick one and send us a pull request):

* DATACLUSTER_LH_CLUSTER_IS_USED
* DATASEGMENT_ADD
* DATASEGMENT_DROP
* RECORD_CHANGE_IDENTITY
* POSITIONS_HIGHER
* POSITIONS_LOWER
* RECORD_CLEAN_OUT
* POSITIONS_FLOOR
* POSITIONS_CEILING
* PUSH_RECORD
* PUSH_DISTRIB_CONFIG
* DB_COPY
* REPLICATION
* CLUSTER
* DB_FREEZE
* DB_RELEASE

For a more complete list, check out the [Driver Compatibility Matrix](#driver-compatibility-matrix)

Supported database versions
========

We test each release against the following OrientDB versions: 1.1.0, 1.3.0.

We've had to drop OrientDB 1.2.0 support because of this [issue](https://github.com/nuvolabase/orientdb/issues/949). If you're using 1.2.0, we strongly encourage you to evaluate 1.3.0.

Testing
========

An OrientDB Graph Edition server instance must be running. Use the [test configuration files](https://github.com/gabipetrovay/node-orientdb/tree/master/config/test) to provide data to the tests about the running instance (user, port, etc.).

Then run:

`npm test`

to run all the tests under `test`, or

`node test/db_open_close.js`

to run a specific test.

And make sure all run before you make a pull request.

NOTE: The `test/z_shutdown.js` will shutdown the server. So make sure it's the last one to run. (i.e. Don't add a test that is after this one in Lexicographical order.)

Connecting to a database
========

```javascript
var orient = require("orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var dbConfig = {
    user_name: "admin",
    user_password: "admin"
};
var serverConfig = {
    host: "localhost",
    port: 2424
};

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);

db.open(function(err) {

    if (err) {
        console.log(err);
        return;
    }

    console.log("Database '" + db.databaseName + "' has " + db.clusters.length + " clusters");

    // use db.command(...) function to run OrientDB SQL queries
});
```
 
Changes
========

See [ChangeLog](https://github.com/gabipetrovay/node-orientdb/blob/master/ChangeLog)

Driver Compatibility Matrix
========

The following table list all the commands exposed by OrientDB. It's here to help you helping us: just pick one of the not yet implemented commands and send us a pull request.

Each command has a JS API if it's already supported, or a "not yet implemented" if not.

It also has a Yes/No/Not yet label under each supported OrientDB versions: commands may be implemented but may be available only with recent OrientDB.

<table>
   <tbody>
      <tr>
         <td><strong>Command</strong></td>
         <td><strong>JS API</strong></td>
         <td><strong>OrientDB 1.1.0</strong></td>
         <td><strong>OrientDB 1.3.0</strong></td>
         <td><strong>OrientDB 1.4.0</strong></td>
      </tr>
      <tr>
         <td>SHUTDOWN</td>
         <td>Server.shutdown</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>CONNECT</td>
         <td>Server.connect</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_OPEN</td>
         <td>Db.open</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_CREATE</td>
         <td>Db.create</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_CLOSE</td>
         <td>Db.close</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_EXIST</td>
         <td>Db.exist</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_DROP</td>
         <td>Db.drop</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_SIZE</td>
         <td>Db.size</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_COUNTRECORDS</td>
         <td>Db.countRecords</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DATACLUSTER_ADD</td>
         <td>Db.addDataCluster</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DATACLUSTER_DROP</td>
         <td>Db.removeDataCluster</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DATACLUSTER_COUNT</td>
         <td>Db.countDataClusters</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DATACLUSTER_DATARANGE</td>
         <td>Db.rangeDataClusters</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DATACLUSTER_LH_CLUSTER_IS_USED</td>
         <td><strong>Not yet implemented</strong></td>
         <td>No</td>
         <td>Not yet</td>
         <td>Not yet</td>
      </tr>
      <tr>
         <td>DATASEGMENT_ADD</td>
         <td><strong>Not yet implemented</strong></td>
         <td>Not yet</td>
         <td>Not yet</td>
         <td>Not yet</td>
      </tr>
      <tr>
         <td>DATASEGMENT_DROP</td>
         <td><strong>Not yet implemented</strong></td>
         <td>Not yet</td>
         <td>Not yet</td>
         <td>Not yet</td>
      </tr>
      <tr>
         <td>RECORD_LOAD</td>
         <td>Db.loadRecord</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>RECORD_CREATE</td>
         <td>Db.createRecord</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>RECORD_UPDATE</td>
         <td>Db.updateRecord</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>RECORD_DELETE</td>
         <td>Db.deleteRecord</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>RECORD_CHANGE_IDENTITY</td>
         <td><strong>Not yet implemented</strong></td>
         <td>No</td>
         <td>Not yet</td>
         <td>Not yet</td>
      </tr>
      <tr>
         <td>POSITIONS_HIGHER</td>
         <td><strong>Not yet implemented</strong></td>
         <td>No</td>
         <td>Not yet</td>
         <td>Not yet</td>
      </tr>
      <tr>
         <td>POSITIONS_LOWER</td>
         <td><strong>Not yet implemented</strong></td>
         <td>No</td>
         <td>Not yet</td>
         <td>Not yet</td>
      </tr>
      <tr>
         <td>RECORD_CLEAN_OUT</td>
         <td><strong>Not yet implemented</strong></td>
         <td>No</td>
         <td>Not yet</td>
         <td>Not yet</td>
      </tr>
      <tr>
         <td>POSITIONS_FLOOR</td>
         <td><strong>Not yet implemented</strong></td>
         <td>No</td>
         <td>Not yet</td>
         <td>Not yet</td>
      </tr>
      <tr>
         <td>POSITIONS_CEILING</td>
         <td><strong>Not yet implemented</strong></td>
         <td>No</td>
         <td>Not yet</td>
         <td>Not yet</td>
      </tr>
      <tr>
         <td>COUNT</td>
         <td>Db.countRecords</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>COMMAND</td>
         <td>Db.command</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>TX_COMMIT</td>
         <td>Db.commit</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>CONFIG_GET</td>
         <td>Server.configGet</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>CONFIG_SET</td>
         <td>Server.configSet</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>CONFIG_LIST</td>
         <td>Server.configList</td>
         <td>Yes</td>
         <td>No</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_RELOAD</td>
         <td>Db.reload</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_LIST</td>
         <td>Server.listDatabases</td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>PUSH_RECORD</td>
         <td><strong>Not yet implemented</strong></td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>PUSH_DISTRIB_CONFIG</td>
         <td><strong>Not yet implemented</strong></td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_COPY</td>
         <td><strong>Not yet implemented</strong></td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>REPLICATION</td>
         <td><strong>Not yet implemented</strong></td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>CLUSTER</td>
         <td><strong>Not yet implemented</strong></td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_FREEZE</td>
         <td><strong>Not yet implemented</strong></td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
      <tr>
         <td>DB_RELEASE</td>
         <td><strong>Not yet implemented</strong></td>
         <td>Yes</td>
         <td>Yes</td>
         <td>Yes</td>
      </tr>
   </tbody>
</table>
