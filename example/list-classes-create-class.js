var config = require('../test/test-server.json'),
    OrientDB = require('../lib'),
    orientdb = OrientDB(config),
    db = orientdb.use('testdb_dbapi_workflow1');


db.class.list()
.then(function (results) {
  console.log(results);
  return db.class.create('TestClass');
})
.then(function (results) {
  console.log(results);
})
.done();