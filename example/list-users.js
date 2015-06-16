var config = require('../test/test-server.json'),
    OrientDB = require('../lib'),
    orientdb = OrientDB(config),
    db = orientdb.use('GratefulDeadConcerts');


db.class.get('OUser')
.then(function (OUser) {
  return OUser.list();
})
.then(function (results) {
  console.log('Users:', results);
  process.exit();
})
.done();
