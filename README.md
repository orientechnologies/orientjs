Introduction
========

This is a node.js driver for OrientDB using the OrientDB binary protocol. This driver is based on the latest version of OrientDB: 1.7.0.

Installation
========

```
npm install node-orientdb
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

Documentation
========

* [Quick Start](https://github.com/orientechnologies/orientdb/wiki/Quick-Start)
* [Server](https://github.com/nitrog7/node-orientdb/wiki/Server-API)
* [Database](https://github.com/nitrog7/node-orientdb/wiki/Document-Database)
    * [Records](https://github.com/nitrog7/node-orientdb/wiki/Document-Database#records)
    * [Data Clusters](https://github.com/nitrog7/node-orientdb/wiki/Document-Database#data-clusters)
    * [Data Segments](https://github.com/nitrog7/node-orientdb/wiki/Document-Database#data-cluster)
* [Graph Database](https://github.com/nitrog7/node-orientdb/wiki/Graph-Database)
    * [Vertex](https://github.com/nitrog7/node-orientdb/wiki/Graph-Database#wiki-vertex)
    * [Edge](https://github.com/nitrog7/node-orientdb/wiki/Graph-Database#wiki-edges)

Tutorial
========

Overview of OrientDB and concepts:
* [Overview](http://www.youtube.com/watch?v=o_7NCiTLVis)

To start using OrientDB, check out the following YouTube tutorials based on version 1.6.2:
* [Getting Started](https://www.youtube.com/watch?v=X-pXqvVTK6E)
* [Querying](https://www.youtube.com/watch?v=w0VfWljYEbw)
* [Creating a Schema](https://www.youtube.com/watch?v=KzkjKwkpMII)
* [Populating the Database](https://www.youtube.com/watch?v=MeXLuErdDHw)
* [Using the Database](https://www.youtube.com/watch?v=oAeY-pXBi-I)

Example
========

```javascript
var Orientdb = require('node-orientdb');
var Db       = Orientdb.GraphDb;

var dbConfig = {
    //Server
    server_host:'localhost',
    server_port:2424,
    server_username:'admin',
    server_password:'admin',

    //Database
    database_name:'test',
    database_username:'admin',
    database_password:'admin',
    database_type: 'document', //Optional. Default: document.
    database_storage: 'local' //Optional. Default: local.
};

var db = new Db(dbConfig);

db.open()
    .then(function(results) {
	    //Details
        console.log("Database '" + db.databaseName + "' has " + db.clusters.length + " clusters");

		//SQL Statement
		var sql  = 'SELECT FROM Users';
		var opts = {};
		
        //Queries
        db.query(sql, options)
            .then(function(results) {
        		console.log(results);
        	})
        	.error(function(error) {
        		console.log(error);
        	});
	})
	.error(function(error) {
		console.log(error);
	});
```

Changes
========

See [ChangeLog](https://github.com/nitrog7/node-orientdb/blob/master/ChangeLog)

Driver Compatibility
========

To see if your version of OrientDB supports a method, please see the compatibility list: [Operation Types](https://github.com/orientechnologies/orientdb/wiki/Network-Binary-Protocol#operation-types)
