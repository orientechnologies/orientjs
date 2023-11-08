# OrientJS driver

Official [orientdb](http://www.orientechnologies.com/orientdb/) driver for node.js. Fast, lightweight, uses the binary protocol.
[![REUSE status](https://api.reuse.software/badge/github.com/orientechnologies/orientjs)](https://api.reuse.software/info/github.com/orientechnologies/orientjs)
[![npm version](https://img.shields.io/npm/v/orientjs.svg?style=flat-square)](https://www.npmjs.com/package/orientjs)
[![npm downloads](https://img.shields.io/npm/dm/orientjs.svg?style=flat-square)](https://www.npmjs.com/package/orientjs)

NOTE: _Release v3.0 provides new APIs in order to support OrientDB 3.0 features_.

# Features

- Tested with latest OrientDB (2.2.x and 3.0.x).
- Intuitive API, based on [bluebird](https://github.com/petkaantonov/bluebird) promises.
- Fast binary protocol parser.
- Streaming Support
- Stateful Transaction Support
- Distributed Support
- Access multiple databases via the same socket (Session Pooling).
- Connection Pooling
- Migration support.
- Simple CLI.


# Versions and Compatibility

OrientJS v3.0 contains backwards compatible APIs for OrientDB 2.2.x and OrientDB 3.0.x using the old protocol version 33 ([Legacy](http://orientdb.com/docs/last/orientjs/OrientJS-Legacy.html)). New APIs are shipped in v3.0 to support the new protocol featuring Streaming, Stateful transactions, new SQL engine etc..


# Resources


- [Documentation](https://orientdb.com/docs/last/OrientJS.html)
<!--- [API Docs](http://orientdb.com/docs/last/orientjs/OrientJS.html)-->
- [Example Projects](https://github.com/orientechnologies/orientjs-example)


# Installation

Install via npm.

```sh
npm install orientjs
```
For Typescript usage :

```sh
npm install @types/orientjs
```

# Quick Start

## Connect to OrientDB

Use the `connect` function in order to create a new `OrientDBClient` instance.

```js
const OrientDBClient = require("orientjs").OrientDBClient;

OrientDBClient.connect({
  host: "localhost",
  port: 2424
}).then(client => {
  return client.close();
}).then(()=> {
   console.log("Client closed");
});
```



### Single Session

To open a new standalone session use the `client.session` api. This api will create a new stateful session associated with the given database and credentials. Once done, call `session.close` in order to release the session on the server. Session are stateful since OrientJS 3.0 as they can execute server side transactions.


```js
client.session({ name: "demodb", username: "admin", password: "admin" })
.then(session => {
	// use the session
	... 
	// close the session
	return session.close();
});
```



### Pooled Sessions

Opening and closing sessions everytime can be expensive, since open and close require a network request to the server. Use the API `client.sessions` to create a pool of sessions with a given database and credentials. To get a session from the pool call the api `pool.acquire`. Once done with the session you can return the session to the pool by calling `session.close`


```js
// Create a sessions Pool
client.sessions({ name: "demodb", username: "admin", password: "admin", pool: { max: 10} })
  .then(pool => {
    // acquire a session
    return pool.acquire()
      .then(session => {
        // use the session
        ...
        // release the session
        return session.close();
      })
      .then(() => {
      	 // close the pool
        return pool.close();
      });
  });
});
```

## Session API

Once obtained a session using the above APIs you can:

- Run a Query (Idempotent SQL statement)
- Run a Command (Idempotent or non idempotent SQL statement)
- Run a Transaction
- Run a live query


### Query


Streaming

```js
session.query("select from OUser where name = :name", {params: { name: "admin" }})
.on("data", data => {
	console.log(data);
})
.on('error',(err)=> {
  console.log(err);
})
.on("end", () => {
	console.log("End of the stream");
});
```


or use `.all` API that convert the stream to a Promise and collect the result set into an array

```js
session.query("select from OUser where name = :name", { params : {name: "admin" }})
.all()
.then((results)=> {
	console.log(results);
});
```

### Command

```js
session.command("insert into V set name = :name", {params: { name: "test" }})
.all()
.then(result => {
	console.log(result);
});
```

### Transaction

Use the api session.runInTransaction in order to run a unit of work in a managed transaction (begin/commit/retry)

```js
session.runInTransaction((tx)=>{
	return tx.command("insert into V set name = :name", {params: { name: "test" }}).all()
}).then(({result,tx}) => {
	console.log(result);
	console.log(tx);
});
```

### Live Queries


```js
session.liveQuery("select from V").on("data", data => {
	console.log(data);
});
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

	
## History

In 2012, [Gabriel Petrovay](https://github.com/gabipetrovay) created the original [node-orientdb](https://github.com/gabipetrovay/node-orientdb) library, with a straightforward callback based API.

In early 2014, [Giraldo Rosales](https://github.com/nitrog7) made a [whole host of improvements](https://github.com/nitrog7/node-orientdb), including support for orientdb 1.7 and switched to a promise based API.

Later in 2014, codemix refactored the library to make it easier to extend and maintain, and introduced an API similar to [nano](https://github.com/dscape/nano). The result is so different from the original codebase that it warranted its own name and npm package. This also gave us the opportunity to switch to semantic versioning.

In June 2015, Orient Technologies company officially adopted the Oriento driver and renamed it as OrientJS.

### Notes for contributors

Please see [CONTRIBUTING](./CONTRIBUTING.md).

### Building from the Source Code

When building from source code, you need to download the driver directly from [GitHub](https://github.com/orientechnologies/orientjs), then run NPM against the branch you want to use or test.

1. Using Git, clone the package repository, then enter the new directory:

   <pre>
   $ <code class="lang-sh userinput">git clone https://github.com/orientechnologies/orientjs.git</code>
   $ <code class="lang-sh userinput">cd orientjs</code>
   </pre>

2. When you clone the repository, Git automatically provides you with the current state of the `master` branch.  If you would like to work with another branch, like `develop` or test features on past releases, you need to check out the branch you want.  For instance,

   <pre>
   $ <code class="lang-sh userinput">git checkout develop</code>
   </pre>

3. Once you've selected the branch you want to build, call NPM to handle the installation.

   <pre>
   $ <code class="lang-sh userinput">npm install</code>
   </pre>
 
4. Run the tests to make sure it works:

   <pre>
   $ <code class="lang-sh userinput">npm test</code>
   </pre>


### Changes

See [CHANGELOG](./CHANGELOG.md)



### License

Apache 2.0 License, see [LICENSE](./LICENSE.md)

