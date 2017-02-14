var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.Client(config);


client.connect().then(function () {

  client.open({name: "test", username: "admin", password: "admin"})
    .bind(this)
    .then(function (session) {
      this.session = session;
      this.session.liveQuery("live select from V")
        .subscribe(function (result) {
          console.log(result);
          session.close().then(process.exit);
        }, function (err) {
          console.log(err);
        }, function () {
          console.log("end");
        });

      setTimeout(function () {
        session.create("VERTEX", "V")
          .set(
            {
              name: 'a',
              creation: '2001-01-01 00:00:01'
            })
          .one()
      }, 200)

    })
});



