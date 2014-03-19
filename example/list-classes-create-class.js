var config = require('../test/test-server.json'),
    Oriento = require('../lib'),
    oriento = Oriento(config),
    db = oriento.use('GratefulDeadConcerts');


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