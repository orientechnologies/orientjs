var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.Client(config);


client.connect().then(function () {
  client.openPool({name: "demodb", username: "admin", password: "admin"})
    .then(function(pool){
      this.pool = pool;
      return this.pool.acquire();
    })
    .then(function (db) {
      this.db = db;
      return db.query("select from V").all();
    })
    .bind(this)
    .then(function (res) {
      console.log(res);
      return this.db.close()
    })
    .then(function () {
      return this.pool.close();
    }).then(function(){
      process.exit()
  })
});



