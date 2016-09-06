# OrientJS driver

Official [orientdb](http://www.orientechnologies.com/orientdb/) driver for node.js. Fast, lightweight, uses the binary protocol.

[![Build Status](https://travis-ci.org/orientechnologies/orientjs.svg?branch=master)](https://travis-ci.org/orientechnologies/orientjs)
[![Coverage Status](https://coveralls.io/repos/github/orientechnologies/orientjs/badge.svg?branch=master)](https://coveralls.io/github/orientechnologies/orientjs?branch=master)
[![npm version](https://img.shields.io/npm/v/orientjs.svg?style=flat-square)](https://www.npmjs.com/package/orientjs)
[![npm downloads](https://img.shields.io/npm/dm/orientjs.svg?style=flat-square)](https://www.npmjs.com/package/orientjs)

NOTE: _Release v2.2 contains big improvement on marshalling by using native C driver_.

# Features

- Tested with latest OrientDB (2.1.x and 2.2.x).
- Intuitive API, based on [bluebird](https://github.com/petkaantonov/bluebird) promises.
- Fast binary protocol parser.
- Distributed Support
- Access multiple databases via the same socket.
- Migration support.
- Simple CLI.
- Connection Pooling



# Documentation

**Main Topics**

- [Introduction](http://orientdb.com/docs/last/OrientJS.html)
- [Server API](http://orientdb.com/docs/last/OrientJS-Server.html)
- [Database API](http://orientdb.com/docs/last/OrientJS-Database.html)
- [Class API](http://orientdb.com/docs/last/OrientJS-Class.html)
- [Index API](http://orientdb.com/docs/last/OrientjS-Index.mdi)
- [Function API](http://orientdb.com/docs/last/OrientJS-Functions.html)
- [Queries](http://orientdb.com/docs/last/OrientJS-Query.html)
- [Transactions](http://orientdb.com/docs/last/OrientJS-Transactions.html)
- [Events](http://orientdb.com/docs/last/OrientJS-Events.html)


# Supported Versions

OrientJS aims to work with version 2.0.0 of OrientDB and later. While it may work with earlier versions, they are not currently supported, [pull requests are welcome!](./CONTRIBUTING.md)

> **IMPORTANT**: OrientJS does not currently support OrientDB's Tree Based [RIDBag](https://github.com/orientechnologies/orientdb/wiki/RidBag) feature because it relies on making additional network requests.
> This means that by default, the result of e.g. `JSON.stringify(record)` for a record with up to 119 edges will be very different from a record with 120+ edges.
> This can lead to very nasty surprises which may not manifest themselves during development but could appear at any time in production.
> There is an [open issue](https://github.com/orientechnologies/orientdb/issues/2315) for this in OrientDB, until that gets fixed, it is **strongly recommended** that you set `RID_BAG_EMBEDDED_TO_SBTREEBONSAI_THRESHOLD` to a very large value, e.g. 2147483647.
> Please see the [relevant section in the OrientDB manual](http://www.orientechnologies.com/docs/2.0/orientdb.wiki/RidBag.html#configuration) for more information.

# Installation

Install via npm.

```sh
npm install orientjs
```

To install OrientJS globally use the `-g` option:

```sh
npm install orientjs -g
```

# Running Tests

To run the test suite, first invoke the following command within the repo, installing the development dependencies:

```sh
npm install
```

Then run the tests:

```sh
npm test
```



##CLI

An extremely minimalist command line interface is provided to allow
databases to created and migrations to be applied via the terminal.

To be useful, OrientJS requires some arguments to authenticate against the server. All operations require the `password` argument unless the user is configured with an empty password. For operations that involve a specific db, include the `dbname` argument (with `dbuser` and `dbpassword` if they are set to something other than the default).

You can get a list of the supported arguments using `orientjs --help`.

```sh
  -d, --cwd         The working directory to use.
  -h, --host        The server hostname or IP address.
  -p, --port        The server port.
  -u, --user        The server username.
  -s, --password    The server password.
  -n, --dbname      The name of the database to use.
  -U, --dbuser      The database username.
  -P, --dbpassword  The database password.
  -?, --help        Show the help screen.
```

If it's too tedious to type these options in every time, you can also create an `orientjs.opts` file containing them. OrientJS will search for this file in the working directory and apply any arguments it contains.
For an example of such a file, see [test/fixtures/orientjs.opts](./test/fixtures/orientjs.opts).


> Note: For brevity, all these examples assume you've installed OrientJS globally (`npm install -g orientjs`) and have set up an orientjs.opts file with your server and database credentials.

### Database CLI Commands.

#### Listing all the databases on the server.

```sh
orientjs db list
```

#### Creating a new database

```sh
orientjs db create mydb graph plocal
```

#### Destroying an existing database

```sh
orientjs db drop mydb
```

### Migrations

OrientJS supports a simple database migration system. This makes it easy to keep track of changes to your orientdb database structure between multiple environments and distributed teams.

When you run a migration command, OrientJS first looks for an orient class called `Migration`. If this class doesn't exist it will be created.
This class is used to keep track of the migrations that have been applied.

OrientJS then looks for migrations that have not yet been applied in a folder called `migrations`. Each migration consists of a simple node.js module which exports two methods - `up()` and `down()`. Each method receives the currently selected database instance as an argument.

The `up()` method should perform the migration and the `down()` method should undo it.

> Note: Migrations can incur data loss! Make sure you back up your database before migrating up and down.

In addition to the command line options outlined below, it's also possible to use the migration API programatically:

```js
var db = server.use('mydb');

var manager = new OrientDB.Migration.Manager({
  db: db,
  dir: __dirname + '/migrations'
});

manager.up(1)
.then(function () {
  console.log('migrated up by one!')
});
```


#### Listing the available migrations

To list all the unapplied migrations:

```sh
orientjs migrate list
```

#### Creating a new migration

```sh
orientjs migrate create my new migration
```

creates a file called something like `m20140318_200948_my_new_migration` which you should edit to specify the migration up and down methods.


#### Migrating up fully

To apply all the migrations:

```sh
orientjs migrate up
```

#### Migrating up by 1

To apply only the first migration:

```sh
orientjs migrate up 1
```

#### Migrating down fully

To revert all migrations:

```sh
orientjs migrate down
```

#### Migrating down by 1

```sh
orientjs migrate down 1
```

##Troubleshooting

* Node exception Maximum call stack size exceeded [here](https://github.com/orientechnologies/orientjs/issues/116)
	
## History

In 2012, [Gabriel Petrovay](https://github.com/gabipetrovay) created the original [node-orientdb](https://github.com/gabipetrovay/node-orientdb) library, with a straightforward callback based API.

In early 2014, [Giraldo Rosales](https://github.com/nitrog7) made a [whole host of improvements](https://github.com/nitrog7/node-orientdb), including support for orientdb 1.7 and switched to a promise based API.

Later in 2014, codemix refactored the library to make it easier to extend and maintain, and introduced an API similar to [nano](https://github.com/dscape/nano). The result is so different from the original codebase that it warranted its own name and npm package. This also gave us the opportunity to switch to semantic versioning.

In June 2015, Orient Technologies company officially adopted the Oriento driver and renamed it as OrientJS.

### Notes for contributors

Please see [CONTRIBUTING](./CONTRIBUTING.md).

### Changes

See [CHANGELOG](./CHANGELOG.md)



### License

Apache 2.0 License, see [LICENSE](./LICENSE.md)

