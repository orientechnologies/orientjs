var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.OrientDBClient(config);


client.connect().then(function () {


  client.on('cluster-config',(cfg)=>{
    console.log(cfg);
  })
  client.open({name: "demodb", username: "admin", password: "admin"})
    .then(function (session) {
      console.log("Connected");
      this.session = session;
    }).catch((err)=> {
    console.oog()
  });
}).catch((err)=>{
  console.log(err);
  process.exit(1);
});



