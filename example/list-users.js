var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.OrientDBClient(config);


client.connect().then(function () {
  return client.open({name: "demodb", username: "admin", password: "admin"});
}).then(function (db) {
  db.class.get('OUser')
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


