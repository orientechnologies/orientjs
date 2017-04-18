var config = require('../test/test-server.json');
config.useToken = true;
var OrientDB = require('../lib'),
  orientdb = OrientDB(config),
  db = orientdb.use('GratefulDeadConcerts');


db.liveQuery("live select from OUser").on('live-update', function (res) {
  console.log(res);
});

db.liveQuery("live select from V").on('live-update', function (res) {
  console.log(res);
});
