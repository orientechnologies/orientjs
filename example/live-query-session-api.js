var config = require('../test/test-server.json'),
  OrientDB = require('../lib'),
  client = new OrientDB.Client(config);


// client.connect().then(function () {
//
//   client.open({name: "demodb", username: "admin", password: "admin"})
//     .bind(this)
//     .then(function (session) {
//       this.session = session;
//       this.session.liveQuery("live select from V")
//         .subscribe(function (result) {
//           console.log(result);
//           session.query("live unsubscribe " + result.token);
//         }, function (err) {
//           console.log(err);
//         }, function () {
//           console.log("end");
//           session.close().then(process.exit);
//         });
//
//       setTimeout(function () {
//         session.create("VERTEX", "V")
//           .set(
//             {
//               name: 'a',
//               creation: '2001-01-01 00:00:01'
//             })
//           .one()
//       }, 200)
//
//     })
// });



