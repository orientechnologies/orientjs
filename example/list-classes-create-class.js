var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.Client(config);


client.connect().then(function () {
  return client.open({name: "demodb", username: "admin", password: "admin"});
}).then(function (session) {
  session.class.list()
    .then(function (results) {
      return session.class.create('TestClass');
    })
    .then(function (results) {
      console.log('Created Class:', results.name);
      return session.class.drop('TestClass');
    })
    .then(function (results) {
      console.log('Deleted Class');
      process.exit();
    })
    .done();
});

