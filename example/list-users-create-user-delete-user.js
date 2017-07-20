var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.Client(config),
  Promise = require('bluebird');


client.connect().then(function () {
  return client.open({name: "demodb", username: "admin", password: "admin"});
}).then(function (b) {
  db.class.get('OUser')
    .then(function (OUser) {
      return Promise.all([
        OUser.create({
          name: 'TestUser123',
          password: 'thisisnotastrongpassword',
          status: 'ACTIVE'
        }),
        OUser.list()
      ]);
    })
    .then(function (results) {
      console.log('Created User: ', results[0]);
      console.log('Found Users: ', results[1].map(function (user) {
        return user.name
      }).join(', '));
      return db.record.delete(results[0]);
    })
    .then(function (response) {
      console.log('Deleted User:', response);
      process.exit();
    })
    .done();
})

