var Promise = require('bluebird');
var Errors = require('../../lib/errors');
describe("ODatabase API - Live Query ", function () {

  // TODO
  //
  // this.timeout(20000);
  // before(function () {
  //   return CREATE_DB("test_session_api_query")
  //     .bind(this)
  //     .then(function () {
  //       return TEST_CLIENT.open({name: "test_session_api_query"});
  //     })
  //     .then(function (session) {
  //       this.session = session;
  //       return this.session.class.create('Test', 'V');
  //     })
  //     .then(function (item) {
  //       this.class = item;
  //       return this.class.property.create([
  //         {
  //           name: 'name',
  //           type: 'String'
  //         },
  //         {
  //           name: 'creation',
  //           type: 'DateTime'
  //         }
  //       ]);
  //     })
  //     .then(function () {
  //       return this.class.create([
  //         {
  //           name: 'a',
  //           creation: '2001-01-01 00:00:01'
  //         },
  //         {
  //           name: 'b',
  //           creation: '2001-01-02 12:00:01'
  //         },
  //         {
  //           name: 'c',
  //           creation: '2009-01-01 00:12:01'
  //         },
  //         {
  //           name: 'd',
  //           creation: '2014-09-01 00:01:01'
  //         },
  //         {
  //           name: 'e',
  //           creation: '2014-09-01 00:24:01'
  //         }
  //       ])
  //     });
  // });
  // after(function () {
  //   return DELETE_TEST_DB('test_session_api_query');
  // });
  //
  //
  // it('should trigger live query', function (done) {
  //
  //   var TOTAL = 2;
  //   var count = 0;
  //
  //   var session = this.session;
  //   this.session.liveQuery("LIVE SELECT FROM Test")
  //     .subscribe(function (live) {
  //       count++;
  //       live.data.content.name.should.eql('a');
  //       if (count === TOTAL) {
  //         session.query("live unsubscribe " + live.token).then(function (res) {
  //
  //         });
  //       }
  //     }, function (err) {
  //       throw new Error('Should never happen!');
  //     }, function () {
  //       done();
  //     });
  //   var self = this;
  //   setTimeout(function () {
  //     var promises = [];
  //     for (var i = 0; i < TOTAL; i++) {
  //       promises.push(self.session.create("VERTEX", "Test")
  //         .set(
  //           {
  //             name: 'a',
  //             creation: '2001-01-01 00:00:01'
  //           })
  //         .one())
  //     }
  //     Promise.all(promises).then(function (rec) {
  //     })
  //   }, 1000);
  //
  // });
  //
  // it('should trigger live query error', function (done) {
  //
  //   this.session.liveQuery("LIVE SELECT FROM Test2")
  //     .subscribe(function (live) {
  //       throw new Error('Should never happen!');
  //     }, function (err) {
  //       err.should.be.an.instanceOf(Errors.RequestError);
  //       done();
  //     }, function () {
  //       throw new Error('Should never happen!');
  //     });
  // });

});
