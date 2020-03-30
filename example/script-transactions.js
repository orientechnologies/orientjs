var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.OrientDBClient(config);


client.connect().then(function () {
  return client.open({name: "demodb", username: "admin", password: "admin"});
}).then(function (db) {

  db
    .let('firstVertex', function (s) {
      s
        .create('vertex', 'V')
        .set({
          foo: 'bar',
          when: new Date()
        });
    })
    .let('secondVertex', function (s) {
      s
        .create('vertex', 'V')
        .set({
          greeting: 'Hello World',
          nested: {
            a: 1,
            b: 2,
            c: 3
          }
        });
    })
    .let('joiningEdge', function (s) {
      s
        .create('edge', 'E')
        .from('$firstVertex')
        .to('$secondVertex')
        .set({
          edgeProp1: 'a',
          edgeProp2: 'b',
          wat: true
        });
    })
    .commit()
    .return('$joiningEdge')
    .all()
    .then(function (results) {
      console.log(results);
      db.close();
      process.exit();
    })
    .done();

});
