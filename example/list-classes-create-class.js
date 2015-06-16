var config = require('../test/test-server.json'),
    OrientDB = require('../lib'),
    orientdb = OrientDB(config),
    db = orientdb.use('GratefulDeadConcerts');


db.class.list()
.then(function (results) {
  console.log('Existing Classes:', results);
  return db.class.create('TestClass');
})
.then(function (results) {
  console.log('Created Class:', results);
  return db.class.delete('TestClass');
})
.then(function (results) {
  console.log('Deleted Class');
  process.exit();
})
.done();
