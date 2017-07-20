var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.Client(config);


client.connect().then(function () {

  client.open({name: "demodb", username: "admin", password: "admin"})
    .then(function (db) {
      this.db = db;
      return db.query("select from V").all();
    }).then(function (res) {
      console.log(res);
      return this.db.close()
    })
    .then(function () {
      process.exit()
    })
});



