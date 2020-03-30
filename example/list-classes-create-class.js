var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.OrientDBClient(config);


client.connect().then(function () {
  return client.open({name: "demodb", username: "admin", password: "admin"});
}).then(function (db) {
  db.class.list()
    .then(function (results) {
      return db.class.create('TestClass');
    })
    .then(function (results) {
      console.log('Created Class:', results.name);
      return db.class.drop('TestClass');
    })
    .then(function (results) {
      console.log('Deleted Class');
      process.exit();
    })
    .done();
});

