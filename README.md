# OrientJS driver

Official [orientdb](http://www.orientechnologies.com/orientdb/) driver for node.js. Fast, lightweight, uses the binary protocol.

[![Build Status](https://travis-ci.org/orientechnologies/orientjs.svg?branch=master)](https://travis-ci.org/orientechnologies/orientjs)


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


# Features

- Tested with latest OrientDB (2.0.x and 2.1).
- Intuitive API, based on [bluebird](https://github.com/petkaantonov/bluebird) promises.
- Fast binary protocol parser.
- Distributed Support
- Access multiple databases via the same socket.
- Migration support.
- Simple CLI.
- Connection Pooling




# Table of Contents

* [Configuring the Client](#configuring-the-client)
* [Server API](#server-api)
* [Database API](#database-api)
  * [Record API](#record-api)
  * [Class API](#class-api)
  * [Index API](#index-api)
  * [Query](#query)
  * [Query Builder](#query-builder)
  * [Transaction Builder](#transaction-builder)
  * [Batch Script](#batch-script)   
  * [Function API](#function-api)
  * [Events](#events)
* [CLI](#cli)
  * [Database CLI Commands](#database-cli-commands)
  * [Migrations](#migrations)
* [History](#history)




## Configuring the Client
```js
var OrientDB = require('orientjs');

var server = OrientDB({
  host: 'localhost',
  port: 2424,
  username: 'root',
  password: 'yourpassword'
});
```

```js
// CLOSE THE CONNECTION AT THE END
server.close();
```
### Use [JWT](http://orientdb.com/docs/2.1/Network-Binary-Protocol.html#token)

```js
var server = OrientDB({
  host: 'localhost',
  port: 2424,
  username: 'root',
  password: 'yourpassword',
  useToken: true
});
```

### Distributed Support (experimental)

**Since orientjs 2.1.11**

You can pass paramenter `servers` to specify the OrientDB distributed instances to be used in case of connection error on the primary host.
The only requirement is that at the first connection one of these server have to be online. Then orientjs will keep updated the list of the servers online in the cluster thanks to the push notification that OrientDB send to the connected clients when the shape of the cluster changes.


```js
var OrientDB = require("orientjs");

var server = OrientDB({
 host: '10.0.1.5',
 port: 2424,
 username: 'root',
 password: 'root',
 servers : [{host : '10.0.1.5' , port : 2425}]
});

var db = server.use({
 name: 'GratefulDeadConcerts',
 username: 'admin',
 password: 'admin'
});
```

## Server API

### Listing the databases on the server

```js
server.list()
.then(function (dbs) {
  console.log('There are ' + dbs.length + ' databases on the server.');
});
```

### Creating a new database

```js
server.create({
  name: 'mydb',
  type: 'graph',
  storage: 'plocal'
})
.then(function (db) {
  console.log('Created a database called ' + db.name);
});
```


## Database API

### Using an existing database

```js
var db = server.use('mydb');
console.log('Using database: ' + db.name);

// CLOSE THE DB SESSION AT THE END
db.close();
```

If you want to close also the connection you can

```js
db.close().then(function(){
	// CLOSE THE CONNECTION 
	server.close();
})
```

### Using an existing database with credentials

```js
var db = server.use({
  name: 'mydb',
  username: 'admin',
  password: 'admin'
});
console.log('Using database: ' + db.name);
// CLOSE THE CONNECTION AT THE END
db.close();
```

### Using standalone db object without Server

**Since orientjs 2.1.11**

```
var ODatabase = require('orientjs').ODatabase;
var db = new ODatabase({
	 	host: 'localhost', 
		port: 2424, 
		username : 'admin', 
		password : 'admin', 
		name : 'GratefulDeadConcerts'});

db.open().then(function(){
	return db.query('select from v limit 1');
}).then(function(res){
	console.log(res.length);
	// this will send a db close command and then close the connection
	db.close().then(function(){
		console.log('closed');
	});
});

```


### Record API

#### Loading a record by RID.

```js
db.record.get('#1:1')
.then(function (record) {
  console.log('Loaded record:', record);
});
```

#### Deleting a record

```js
db.record.delete('#1:1')
.then(function () {
  console.log('Record deleted');
});
```
### Class API

#### Listing all the classes in the database

```js
db.class.list()
.then(function (classes) {
  console.log('There are ' + classes.length + ' classes in the db:', classes);
});
```

#### Creating a new class

```js
db.class.create('MyClass')
.then(function (MyClass) {
  console.log('Created class: ' + MyClass.name);
});
```

#### Creating a new class that extends another

```js
db.class.create('MyOtherClass', 'MyClass')
.then(function (MyOtherClass) {
  console.log('Created class: ' + MyOtherClass.name);
});
```

#### Getting an existing class

```js
db.class.get('MyClass')
.then(function (MyClass) {
  console.log('Got class: ' + MyClass.name);
});
```

#### Updating an existing class

```js
db.class.update({
  name: 'MyClass',
  superClass: 'V'
})
.then(function (MyClass) {
  console.log('Updated class: ' + MyClass.name + ' that extends ' + MyClass.superClass);
});
```

#### Listing properties in a class

```js
MyClass.property.list()
.then(function (properties) {
  console.log('The class has the following properties:', properties);
});
```

#### Adding a property to a class

```js
MyClass.property.create({
  name: 'name',
  type: 'String'
})
.then(function () {
  console.log('Property created.')
});
```

To add multiple properties, pass an array of objects. Example:

```js
MyClass.property.create([{
  name: 'name',
  type: 'String'
}, {
  name: 'surname',
  type: 'String'
}])
.then(function () {
  console.log('Property created.')
});
```

#### Deleting a property from a class

```js
MyClass.property.drop('myprop')
.then(function () {
  console.log('Property deleted.');
});
```

#### Renaming a property on a class

```js
MyClass.property.rename('myprop', 'mypropchanged');
.then(function () {
  console.log('Property renamed.');
});
```

#### Creating a record for a class

```js
MyClass.create({
  name: 'John McFakerton',
  email: 'fake@example.com'
})
.then(function (record) {
  console.log('Created record: ', record);
});
```

#### Listing records in a class

```js
MyClass.list()
.then(function (records) {
  console.log('Found ' + records.length + ' records:', records);
});
```
### Index API

#### Create a new index for a class property

```js
db.index.create({
  name: 'MyClass.myProp',
  type: 'unique'
})
.then(function(index){
  console.log('Created index: ', index);
});
```

#### Get entry from class property index

```js
db.index.get('MyClass.myProp')
.then(function (index) {
  index.get('foo').then(console.log.bind(console));
});
```


### Query

#### Execute an Insert Query

```js
db.query('insert into OUser (name, password, status) values (:name, :password, :status)',
  {
    params: {
      name: 'Radu',
      password: 'mypassword',
      status: 'active'
    }
  }
).then(function (response){
  console.log(response); //an Array of records inserted
});

```


#### Execute a Select Query with Params

```js
db.query('select from OUser where name=:name', {
  params: {
    name: 'Radu'
  },
  limit: 1
}).then(function (results){
  console.log(results);
});

```

##### Raw Execution of a Query String with Params

```js
db.exec('select from OUser where name=:name', {
  params: {
    name: 'Radu'
  }
}).then(function (response){
  console.log(response.results);
});

```

### Query Builder

#### Creating a new, empty vertex

```js
db.create('VERTEX', 'V').one()
.then(function (vertex) {
  console.log('created vertex', vertex);
});
```

#### Creating a new vertex with some properties

```js
db.create('VERTEX', 'V')
.set({
  key: 'value',
  foo: 'bar'
})
.one()
.then(function (vertex) {
  console.log('created vertex', vertex);
});
```
#### Deleting a vertex

```js
db.delete('VERTEX')
.where('@rid = #12:12')
.one()
.then(function (count) {
  console.log('deleted ' + count + ' vertices');
});
```

#### Creating a simple edge between vertices

```js
db.create('EDGE', 'E')
.from('#12:12')
.to('#12:13')
.one()
.then(function (edge) {
  console.log('created edge:', edge);
});
```


#### Creating an edge with properties

```js
db.create('EDGE', 'E')
.from('#12:12')
.to('#12:13')
.set({
  key: 'value',
  foo: 'bar'
})
.one()
.then(function (edge) {
  console.log('created edge:', edge);
});
```

#### Deleting an edge between vertices

```js
db.delete('EDGE', 'E')
.from('#12:12')
.to('#12:13')
.scalar()
.then(function (count) {
  console.log('deleted ' + count + ' edges');
});
```

#### Insert Record

```js
db.insert().into('OUser').set({name: 'demo', password: 'demo', status: 'ACTIVE'}).one()
.then(function (user) {
  console.log('created', user);
});
```

#### Update Record

```js
db.update('OUser').set({password: 'changed'}).where({name: 'demo'}).scalar()
.then(function (total) {
  console.log('updated', total, 'users');
});
```

Return the updated record

```js
db.update('#5:0')
.set({ a: 'b' })
.return('after @this')
.one()
.then(function(res){
	console.log(res);
})
```
#### Delete Record

```js
db.delete().from('OUser').where({name: 'demo'}).limit(1).scalar()
.then(function (total) {
  console.log('deleted', total, 'users');
});
```


#### Select Records

```js
db.select().from('OUser').where({status: 'ACTIVE'}).all()
.then(function (users) {
  console.log('active users', users);
});
```

#### Text Search

```js
db.select().from('OUser').containsText({name: 'er'}).all()
.then(function (users) {
  console.log('found users', users);
});
```

#### Select Records with Fetch Plan

```js
db.select().from('OUser').where({status: 'ACTIVE'}).fetch({role: 5}).all()
.then(function (users) {
  console.log('active users', users);
});
```

#### Select an expression

```js
db.select('count(*)').from('OUser').where({status: 'ACTIVE'}).scalar()
.then(function (total) {
  console.log('total active users', total);
});
```

####  Traverse Records

```js
db.traverse().from('OUser').where({name: 'guest'}).all()
.then(function (records) {
  console.log('found records', records);
});
```

#### Return a specific field

```js
db
.select('name')
.from('OUser')
.where({status: 'ACTIVE'})
.column('name')
.all()
.then(function (names) {
  console.log('active user names', names.join(', '));
});
```


#### Transform a field

```js
db
.select('name')
.from('OUser')
.where({status: 'ACTIVE'})
.transform({
  status: function (status) {
    return status.toLowerCase();
  }
})
.limit(1)
.one()
.then(function (user) {
  console.log('user status: ', user.status); // 'active'
});
```


#### Transform a record

```js
db
.select('name')
.from('OUser')
.where({status: 'ACTIVE'})
.transform(function (record) {
  return new User(record);
})
.limit(1)
.one()
.then(function (user) {
  console.log('user is an instance of User?', (user instanceof User)); // true
});
```


#### Specify default values

```js
db
.select('name')
.from('OUser')
.where({status: 'ACTIVE'})
.defaults({
  something: 123
})
.limit(1)
.one()
.then(function (user) {
  console.log(user.name, user.something);
});
```


#### Put a map entry into a map

```js
db
.update('#1:1')
.put('mapProperty', {
  key: 'value',
  foo: 'bar'
})
.scalar()
.then(function (total) {
  console.log('updated', total, 'records');
});
```
### Transaction Builder

Transaction builder help you create batch script that will run on the server as a sigle transaction.

```js
db.let('first',function(f){
		f.create('vertex','V')
		.set({ name : 'John'})
	})
	.let('second',function(s){
		s.create('vertex','V')
		.set({ name : 'John'})
	})
	.let('edge' , function(e){
		e.create('edge','E')
		.from('$first')
		.to('$second')
		.set({ when : new Date()})
	})
	.commit()
	.return('$edge')
	.all()
	.then(function(res){
		console.log(res);
})
```

### Batch Script

You can execute raw [batch script](http://orientdb.com/docs/2.0/orientdb.wiki/SQL-batch.html) without transaction builder

```js
var script = 'begin;let $t0 = select from V limit 1; return $t0' 
db.query(script, { class : 's'})
.then(function(res){
 console.log(res);
});
```


### Function API

You can create a function by supplying a plain javascript function. Please note that the method stringifies the `function` passed so you can't use any varaibles outside the function closure.

```js
db.createFn("nameOfFunction", function(arg1, arg2) {
  return arg1 + arg2;
})
.then(function (count) {
  // Function created!
});
```

You can also omit the name and it'll default to the `Function#name`

```js
db.createFn(function nameOfFunction(arg1, arg2) {
  return arg1 + arg2;
})
.then(function (count) {
  // Function created!
});
```

### Events

You can also bind to the following events

#### `beginQuery`
Given the query

    db.select('name, status').from('OUser').where({"status": "active"}).limit(1).fetch({"role": 1}).one();

The following event will be triggered

    db.on("beginQuery", function(obj) {
      // => {
      //  query: 'SELECT name, status FROM OUser WHERE status = :paramstatus0 LIMIT 1',
      //  mode: 'a',
      //  fetchPlan: 'role:1',
      //  limit: -1,
      //  params: { params: { paramstatus0: 'active' } }
      // }
    });


#### `endQuery`
After a query has been run, you'll get the the following event emitted

    db.on("endQuery", function(obj) {
      // => {
      //   "err": errObj,
      //   "result": resultObj,
      //   "perf": {
      //     "query": timeInMs
      //   }
      // }
    });



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

