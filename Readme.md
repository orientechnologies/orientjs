Introduction
========

This is a node.js driver for OrientDB using the OrientDB binary protocol.

Status
========

NOTE: This OrientDB driver is almost mature now, but we are still testing it. While we use it in production already, we recommend you make some thorough tests before you do it as well. If you find any problems, let us know such that we can improve things. Until version 1.0 we also don't quarantee any backwards compatibility and API stability since we are trying things out. But 1.0 should not be far from now.

Currently this driver implements the OrientDB binary protocol but the plan is to provide both the HTTP and the binary protocol.

The following commands are not implemented yet (just pick one and send us a pull request):

* DATASEGMENT_ADD
* DATASEGMENT_REMOVE
* TX_COMMIT
* CONFIG_GET
* CONFIG_SET
* CONFIG_LIST

Installation
========

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

Connecting to a database
========

```
var orient = require("orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var dbConfig = {
    user_name: "admin",
    user_password: "admin",
};
var serverConfig = {
    host: "localhost",
    port: 2424,
    user_name: "root",
    user_password: "my server passord"
};

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err) {

    if (err) { console.log(err); return; }

    console.log("Database '" + db.databaseName + "' has " + db.clusters.length + " clusters");
}
```

