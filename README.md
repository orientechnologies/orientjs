# Introduction

This is a node.js driver for OrientDB using the OrientDB binary protocol. This driver is based on the latest version of OrientDB: 1.7.0.

# Installation

```
npm install node-orientdb
```

As developer you should fork/clone this repo and once you have it on your machine, do the following in your repo directory:

```
npm install
```

# Status: ALPHA

The old `node-orientdb` codebase had suffered from some neglect and did not support the latest version of orient.
It has therefore been extensively refactored and rewritten to make it faster and easier to maintain, however, this code has not yet been battle tested and may have bugs. If you find an issue, or something is unclear, **please report it so we can fix it**.


Until version 1.0 we also don't guarantee any backwards compatibility and API stability since we are trying things out.

# Running the tests

The tests are now based on [mocha](http://visionmedia.github.io/mocha/) and [should.js](https://github.com/visionmedia/should.js/).

To run the tests:

```
npm test
```

# Supported Versions

We test each release with the most recent version of OrientDB. Although we try to remain backwards compatible, it may not be fully tested. If you experience any problems with an older version than the current, please inform us.

# Documentation

> Note: These links are out of date!

* [Quick Start](https://github.com/orientechnologies/orientdb/wiki/Quick-Start)
* [Server](https://github.com/nitrog7/node-orientdb/wiki/Server-API)
* [Database](https://github.com/nitrog7/node-orientdb/wiki/Document-Database)
    * [Records](https://github.com/nitrog7/node-orientdb/wiki/Document-Database#records)
    * [Data Clusters](https://github.com/nitrog7/node-orientdb/wiki/Document-Database#data-clusters)
    * [Data Segments](https://github.com/nitrog7/node-orientdb/wiki/Document-Database#data-cluster)
* [Graph Database](https://github.com/nitrog7/node-orientdb/wiki/Graph-Database)
    * [Vertex](https://github.com/nitrog7/node-orientdb/wiki/Graph-Database#wiki-vertex)
    * [Edge](https://github.com/nitrog7/node-orientdb/wiki/Graph-Database#wiki-edges)

# Tutorial

Overview of OrientDB and concepts:

* [Overview](http://www.youtube.com/watch?v=o_7NCiTLVis)

To start using OrientDB, check out the following YouTube tutorials based on version 1.6.2:

* [Getting Started](https://www.youtube.com/watch?v=X-pXqvVTK6E)
* [Querying](https://www.youtube.com/watch?v=w0VfWljYEbw)
* [Creating a Schema](https://www.youtube.com/watch?v=KzkjKwkpMII)
* [Populating the Database](https://www.youtube.com/watch?v=MeXLuErdDHw)
* [Using the Database](https://www.youtube.com/watch?v=oAeY-pXBi-I)

# Example

```javascript
var OrientDB = require('node-orientdb');

var server = OrientDB({
  host:'localhost',
  port:2424,
  username:'admin',
  password:'admin',
});


var db = server.use({
  name: 'test',
  username: 'admin',
  password: 'admin',
  type: 'graph', // optional, defaults document
  storage: 'plocal', // optional, defaults to plocal
});

db.cluster.list()
.then(function (clusters) {
  console.log('Database ' + db.name + ' has ' + clusters.length + ' clusters');
  return db.query('SELECT FROM OUser');
})
.then(function (response) {
  console.log('Users:', response);
  return db.record.get('#5:0');
})
.then(function (record) {
  console.log('Loaded Record:', record);
})
.done();
```

# Changes

See [CHANGELOG](./CHANGELOG.md)

# Driver Compatibility

To see if your version of OrientDB supports a method, please see the compatibility list: [Operation Types](https://github.com/orientechnologies/orientdb/wiki/Network-Binary-Protocol#operation-types)
