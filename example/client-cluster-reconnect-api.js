var config = require('../test/test-server.json');
config.servers = [{host: "localhost", port: 2425}];
config.pool = {max: 1,min : 1};

var OrientDB = require('../lib'),
  client = new OrientDB.OrientDBClient(config);


client.connect().then(function () {


  client.open({name: "demodb", username: "admin", password: "admin"})
    .then(function (session) {
      console.log("Connected");
      this.session = session;
      setInterval(() => {
        this.session.query("select from OUser limit 1").all()
          .then((result) => {
            console.log(`Got ${result.length} records`);
          });
      }, 5000)

    }).catch((err) => {
    console.log(err);
  });
}).catch((err) => {
  console.log(err);
  process.exit(1);
});



