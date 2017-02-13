var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.Client(config);


client.connect().then(function () {

  client.open({name: "test", username: "admin", password: "admin"})
    .then(function (session) {
      this.session = session;
      return session.query("select from V").all();
    }).then(function (res) {
      console.log(res);
      return this.session.close()
    })
    .then(function () {
      process.exit()
    })
});



