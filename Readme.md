Introduction
========

This is a node.js driver for OrientDB using the OrientDB binary protocol. This driver is based on the latest version of OrientDB: 1.7.0.

Installation
========

```
npm install orientdb-binary
```

As developer you should fork/clone this repo and once you have it on your machine, do the following in your repo directory:

```
npm install
```

Status
========

The NodeJS OrientDB driver is almost mature, but we are still testing. While we use it in production already and therefore it implements a sufficient number of features for making a fully featured application, we recommend you make some thorough tests before you do it as well. If you find any problems, let us know such that we can improve things. Until version 1.0 we also don't guarantee any backwards compatibility and API stability since we are trying things out. But 1.0 should not be far from now.

Supported Versions
========

We test each release with the most recent version of OrientDB. Although we try to remain backwards compatible, it may not be fully tested. If you experience any problems with an older version than the current, please inform us.

Changes
========

See [ChangeLog](https://github.com/nitrog7/node-orientdb/blob/master/ChangeLog)

Driver Compatibility
========

To see if your version of OrientDB supports a method, please see the compatibility list: [Operation Types](https://github.com/orientechnologies/orientdb/wiki/Network-Binary-Protocol#operation-types)

Testing
========

An OrientDB Graph Edition server instance must be running. Use the [test configuration files](https://github.com/nitrog7/node-orientdb/tree/master/config/test) to provide data to the tests about the running instance (user, port, etc.).

Then run:

`npm test`

to run all the tests under `test`, or

`node test/db_open_close.js`

to run a specific test.

And make sure all run before you make a pull request.

NOTE: The `test/z_shutdown.js` will shutdown the server. So make sure it's the last one to run. (i.e. Don't add a test that is after this one in Lexicographical order.)

Tutorial
========

To start using OrientDB, check out the following YouTube tutorials based on version 1.6.2:
* [Getting Started](https://www.youtube.com/watch?v=X-pXqvVTK6E)
* [Querying](https://www.youtube.com/watch?v=w0VfWljYEbw)
* [Creating a Schema](https://www.youtube.com/watch?v=KzkjKwkpMII)
* [Populating the Database](https://www.youtube.com/watch?v=MeXLuErdDHw)
* [Using the Database](https://www.youtube.com/watch?v=oAeY-pXBi-I)

Example
========

```javascript
var orientdb = require("orientdb-binary"),
var Db       = orientdb.Db;

var dbConfig = {
    username:"admin",
    password:"admin",
    database:"test",
    host: "localhost",
    port: 2424,
    database_type: "document", //Optional. Default: document.
    storage_type: "local" //Optional. Default: local.
};

var db = new Db(dbConfig);

db.open(function(error) {
    if(error) {
        console.log(error);
        return;
    }

    //Details
    console.log("Database '" + db.databaseName + "' has " + db.clusters.length + " clusters");

    //Queries
    db.query("SELECT FROM Users", options, function(error, results){
        db.close();
        
        if(error) {
            console.log(error);
            return;
        }

        console.log(results);
    });
});
```