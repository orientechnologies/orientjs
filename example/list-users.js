var config = require('../test/test-server.json'),
    Oriento = require('../lib'),
    oriento = Oriento(config),
    db = oriento.use('GratefulDeadConcerts');


db.class.get('OUser')
.then(function (OUser) {
  return OUser.list();
})
.then(function (results) {
  console.log('Users:', results);
  process.exit();
})
.done();