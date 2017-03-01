var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.Client(config);


client.connect().then(function () {
  return client.open({name: "GratefulDeadConcerts", username: "admin", password: "admin"});
}).then(function (session) {
  session.class.get('OUser')
    .then(function (OUser) {
      return OUser.list();
    })
    .then(function (results) {
      console.log('Users:', results);
      process.exit();
    })
    .done();
}).catch(function (err) {
  console.log(err);
  process.exit();
});


